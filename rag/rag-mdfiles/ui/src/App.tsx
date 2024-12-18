import React from 'react';
import logo from './logo.svg';
import './App.css';
import ChatApp from './components/ChatApp';

function App() {
  return (

    <div className="App">
      <div className="h-full rounded-lg flex flex-col mx-auto bg-gradient-to-b from-gray-50 to-gray-100 shadow-xl">
      <div className="bg-modal-surface-body-primary p-4 shadow-sm rounded-lg">
        <h1 className="font-alliance text-2xl font-bold text-center text-text-primary">
          Hypermode Chat
        </h1>
      </div>
      <ChatApp />
      </div>
    </div>
  );
}

export default App;
