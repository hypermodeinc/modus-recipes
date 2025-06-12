"use client"

import { useState, useEffect, useCallback } from "react"
import { useSubscription, useQuery, useMutation } from "urql"
import {
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Bot,
  Wifi,
  WifiOff,
  Plus,
  Play,
  Square,
} from "lucide-react"

interface AgentEvent {
  id: string
  name: string
  data: any
  timestamp: string
  agentId: string
  type: "info" | "warning" | "success" | "error"
}

interface Agent {
  id: string
  name: string
  status: "active" | "idle" | "suspended"
  lastEvent: string
  eventCount: number
}

const AGENT_EVENT_SUBSCRIPTION = `
  subscription AgentEvents($agentId: String!) {
    agentEvent(agentId: $agentId) {
      name
      data
      timestamp
    }
  }
`

const GET_ALL_AGENTS_QUERY = `
  query GetAllAgents {
    agents {
      id
      name
      status
    }
  }
`

const CREATE_THEMED_AGENT_MUTATION = `
  mutation CreateThemedAgent($theme: String!) {
    createThemedAgent(theme: $theme)
  }
`

const START_EVENT_GENERATION_MUTATION = `
  mutation StartEventGeneration($agentId: String!) {
    mutateStartEventGeneration(agentId: $agentId)
  }
`

const STOP_AGENT_MUTATION = `
  mutation StopAgent($agentId: String!) {
    stopAgent(agentId: $agentId)
  }
`

function AgentEventSubscription({
  agentId,
  onEvent,
}: {
  agentId: string
  onEvent: (event: any, agentId: string) => void
}) {
  const [{ data, error }] = useSubscription({
    query: AGENT_EVENT_SUBSCRIPTION,
    variables: { agentId },
  })

  if (error) {
    console.error("Subscription error details:", {
      message: error.message,
      graphQLErrors: error.graphQLErrors,
      networkError: error.networkError,
    })
  }

  useEffect(() => {
    if (data?.agentEvent) {
      onEvent(data.agentEvent, agentId)
    }
  }, [data?.agentEvent, agentId, onEvent])

  return null
}

export default function Page() {
  const [events, setEvents] = useState<AgentEvent[]>([])
  const [agentEventCounts, setAgentEventCounts] = useState<Record<string, number>>({})
  const [agentLastEvents, setAgentLastEvents] = useState<Record<string, string>>({})
  const [isConnected, setIsConnected] = useState(false)
  const [newTheme, setNewTheme] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const [agentsResult, refetchAgents] = useQuery({
    query: GET_ALL_AGENTS_QUERY,
    requestPolicy: "cache-and-network", // Always fetch fresh data
  })

  const [, createThemedAgent] = useMutation(CREATE_THEMED_AGENT_MUTATION)
  const [, startEventGeneration] = useMutation(START_EVENT_GENERATION_MUTATION)
  const [, stopAgent] = useMutation(STOP_AGENT_MUTATION)

  const getEventType = useCallback(
    (eventName: string): "info" | "warning" | "success" | "error" => {
      if (eventName.includes("error") || eventName.includes("failed")) return "error"
      if (eventName.includes("threat") || eventName.includes("warning")) return "warning"
      if (eventName.includes("completed") || eventName.includes("success")) return "success"
      return "info"
    },
    [],
  )

  // Handle real agent events from subscriptions - memoized to prevent re-renders
  const handleAgentEvent = useCallback(
    (eventData: any, agentId: string) => {
      const eventType = getEventType(eventData.name)

      const newEvent: AgentEvent = {
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: eventData.name,
        data: eventData.data,
        timestamp: eventData.timestamp,
        agentId,
        type: eventType,
      }

      setEvents((prev) => [newEvent, ...prev.slice(0, 49)]) // Keep last 50 events

      // Update agent event counts and last events
      setAgentEventCounts((prev) => ({
        ...prev,
        [agentId]: (prev[agentId] || 0) + 1,
      }))

      setAgentLastEvents((prev) => ({
        ...prev,
        [agentId]: eventData.name.replace(/_/g, " "),
      }))
    },
    [getEventType],
  )

  // Handle stopping an agent
  const handleStopAgent = async (agentId: string) => {
    try {
      await stopAgent({ agentId })
      // Refetch to update agent status
      refetchAgents({ requestPolicy: "network-only" })
    } catch (error) {
      console.error("Failed to stop agent:", error)
    }
  }
  const handleCreateAgent = async () => {
    if (!newTheme.trim()) return

    setIsCreating(true)
    try {
      const result = await createThemedAgent({ theme: newTheme.trim() })
      if (result.data?.createThemedAgent) {
        setNewTheme("")
        // Force refetch and wait for it to complete to get new agents
        await refetchAgents({ requestPolicy: "network-only" })
      }
    } catch (error) {
      console.error("Failed to create themed agent:", error)
    } finally {
      setIsCreating(false)
    }
  }

  // Track connection status and refetch agents periodically
  useEffect(() => {
    if (agentsResult.data?.agents) {
      setIsConnected(true)
    } else if (agentsResult.error) {
      console.error("Agents query error:", agentsResult.error)
      setIsConnected(false)
    }

    // Set up periodic refetch to catch any missed agents
    const interval = setInterval(() => {
      if (isConnected) {
        refetchAgents({ requestPolicy: "network-only" })
      }
    }, 5000) // Refetch every 5 seconds

    return () => clearInterval(interval)
  }, [agentsResult.data, agentsResult.error, isConnected, refetchAgents])

  // Get enriched agents data combining query data with local state
  const enrichedAgents = (agentsResult.data?.agents || []).map((agent: any) => ({
    ...agent,
    lastEvent: agentLastEvents[agent.id] || "Ready for operations",
    eventCount: agentEventCounts[agent.id] || 0,
    status: agentEventCounts[agent.id] > 0 ? "active" : agent.status,
  }))

  const getEventIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <Activity className="w-4 h-4 text-blue-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-500"
      case "suspended":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Real-time subscriptions for each agent - dynamically subscribe to all current agents */}
      {enrichedAgents
        .filter((agent) => agent.id && agent.id.trim() !== "")
        .map((agent) => (
          <AgentEventSubscription
            key={`sub-${agent.id}`}
            agentId={agent.id}
            onEvent={handleAgentEvent}
          />
        ))}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Agent Events Dashboard</h1>
              <p className="text-lg text-gray-600">
                Real-time monitoring of agent activities and events
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm text-gray-600">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
        </div>

        {/* Connection Error */}
        {agentsResult.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              <div>
                <h3 className="text-red-800 font-medium">Backend Connection Failed</h3>
                <p className="text-red-700 text-sm">
                  Make sure your Modus backend is running at http://localhost:8686
                </p>
                <p className="text-red-600 text-xs mt-1">Error: {agentsResult.error.message}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent Creation Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center mb-4">
                <Plus className="w-5 h-5 text-green-500 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Create Themed Agent</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                  <input
                    type="text"
                    value={newTheme}
                    onChange={(e) => setNewTheme(e.target.value)}
                    placeholder="e.g., matrix, cyberpunk, space, medieval..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isCreating || !isConnected}
                    onKeyPress={(e) => e.key === "Enter" && handleCreateAgent()}
                  />
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={handleCreateAgent}
                    disabled={!newTheme.trim() || isCreating || !isConnected}
                    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isCreating ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-1" />
                        Create
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Agent Status Panel */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <Bot className="w-5 h-5 text-blue-500 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Active Agents</h2>
              </div>

              {agentsResult.fetching && (
                <div className="text-center py-4 text-gray-500">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p>Loading agents...</p>
                </div>
              )}

              {!agentsResult.fetching && enrichedAgents.length === 0 && isConnected && (
                <div className="text-center py-8 text-gray-500">
                  <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No agents created yet</p>
                  <p className="text-sm">Create your first themed agent above</p>
                </div>
              )}

              <div className="space-y-4">
                {enrichedAgents.map((agent) => (
                  <div key={agent.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{agent.name}</h3>
                      <span className={`text-sm font-medium ${getStatusColor(agent.status)}`}>
                        {agent.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{agent.lastEvent}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>Events: {agent.eventCount}</span>
                      <span className="truncate ml-2">{agent.id}</span>
                    </div>

                    {/* Manual Control Buttons */}
                    <div className="flex space-x-1">
                      <button
                        onClick={() => startEventGeneration({ agentId: agent.id })}
                        disabled={!isConnected || agent.status === "suspended"}
                        className="flex-1 bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 disabled:bg-gray-300 flex items-center justify-center"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Generate Event
                      </button>
                      <button
                        onClick={() => handleStopAgent(agent.id)}
                        disabled={!isConnected || agent.status === "suspended"}
                        className="flex-1 bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 disabled:bg-gray-300 flex items-center justify-center"
                      >
                        <Square className="w-3 h-3 mr-1" />
                        Stop
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Panel */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Statistics</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Events</span>
                  <span className="font-medium">{events.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Agents</span>
                  <span className="font-medium">
                    {enrichedAgents.filter((a) => a.status === "active").length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Events/Agent</span>
                  <span className="font-medium">
                    {enrichedAgents.length > 0
                      ? Math.round(events.length / enrichedAgents.length)
                      : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Event Stream */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Zap className="w-5 h-5 text-blue-500 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">Live Event Stream</h2>
                </div>
                <div className="text-sm text-gray-500">{events.length} events</div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {events.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Waiting for agent events...</p>
                    {isConnected && (
                      <p className="text-sm mt-2">Create an agent and start generating events</p>
                    )}
                  </div>
                ) : (
                  events.map((event) => (
                    <div
                      key={event.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          {getEventIcon(event.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-medium text-gray-900">
                                {event.name.replace(/_/g, " ")}
                              </h3>
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {event.agentId.split("_")[1] || event.agentId}
                              </span>
                            </div>
                            {event.data && (
                              <div className="text-sm text-gray-600 bg-gray-50 rounded p-2 mt-2">
                                <pre className="whitespace-pre-wrap font-mono text-xs">
                                  {JSON.stringify(event.data, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center text-xs text-gray-500 ml-4">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* API Status */}
            <div
              className={`border rounded-lg p-6 mt-6 ${isConnected ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
            >
              <h3
                className={`text-lg font-semibold mb-2 ${isConnected ? "text-green-900" : "text-red-900"}`}
              >
                {isConnected ? "Connected to Modus Backend" : "Backend Not Available"}
              </h3>
              <p className={`mb-3 ${isConnected ? "text-green-800" : "text-red-800"}`}>
                {isConnected
                  ? "Real-time connection to Modus agents via GraphQL subscriptions."
                  : "Start your Modus backend to create and manage agents."}
              </p>
              <pre
                className={`p-3 rounded text-sm overflow-x-auto ${isConnected ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"}`}
              >
                {isConnected
                  ? `# Connected via URQL with SSE
subscription AgentEvents($agentId: String!) {
  agentEvent(agentId: $agentId) {
    name
    data 
    timestamp
  }
}`
                  : `# Start your Modus backend:
cd modus && modus dev

# Backend should expose:
query { agents { id name status } }
mutation { createThemedAgent(theme: $theme) }`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
