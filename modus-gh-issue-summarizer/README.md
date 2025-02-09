# GitHub Issue Knowledge Base Generator (Modus + Hypermode) 🚀

This project automatically generates a Knowledge Base (KB) article when a GitHub issue is closed. It
utilizes Hypermode and Modus (a serverless Go framework) to process issue data and generate a
structured KB article using an LLM. The knowledge base article is then posted as a GitHub
Discussion.

## 🛠 Features

- Fetches GitHub issue details and comments upon issue closure.
- Uses LLM (Meta's LLaMa model hosted on Hypermode) to generate a detailed KB article.
- Posts the generated KB article as a GitHub Discussion.
- Can be triggered manually or via GitHub Actions.

--

## 🖥️ Running Locally

### 1️⃣ Install Modus

First, install Modus CLI:

```bash
npm install -g @hypermodeinc/modus
```

### 2️⃣ Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

### 3️⃣ Start the Modus Dev Server

```bash
modus dev
```

### 4️⃣ Test the API Locally

Go to: `http://localhost:54321/graphql`

You'll see an exported function `issueClosedHandler`. Test the KB Article Generation. Enter the
repository name and issue number and run the query. The API will return a formatted KB article. You
can also post the KB Article as a Discussion. To do so, pass a GitHub API token as well.

--

## 🚀 Deploying to Hypermode

To deploy the function to Hypermode:

```bash
modus deploy
```

Once deployed, copy your Hypermode endpoint, which will be used in the GitHub Action.

--

## 🔧 Setting Up the GitHub Action

This action allows the KB article to be generated automatically when an issue is closed.

### 1️⃣ Clone the Project & Deploy to Hypermode

If you haven't already:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
modus deploy
```

Copy your Hypermode endpoint as specified in the Hypermode console.

### 2️⃣ Add the GitHub Action

Copy the issue-summarizer.yml file into in your repository:

### 3️⃣ Add Your Hypermode API Key to GitHub Secrets

1. Go to your GitHub repository.
2. Navigate to Settings → Secrets and variables → Actions.
3. Click New repository secret.
4. Name it: `HYPERMODE_API_KEY`
5. Paste your Hypermode API key.
6. Save.

### 4️⃣ Done! 🎉

Now, every time a GitHub issue is closed, a KB article will be generated and posted as a GitHub
Discussion.

--

## 🛠 Troubleshooting

GitHub Discussion Not Created?

Ensure:

- You have enabled Discussions under Repository Settings → Features.
- Your GitHub token has the discussions: write permission.

No Response from the API?

- Check if your Modus function is deployed (modus deploy).
- Verify that your Hypermode API key is correct in GitHub Secrets.
