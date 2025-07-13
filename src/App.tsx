import React, { useEffect } from "react";
import "./App.css";
import { loadPhaser } from "./PhaserGame";

const App: React.FC = () => {
  useEffect(() => {
    loadPhaser(); // Load Phaser directly on mount
  }, []);

  return <div id="game-container" className="App"></div>;
};

export default App;
