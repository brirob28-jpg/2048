// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
  window.gameManager = new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager);
  window.aiAgent = new AIAgent(4);
  window.aiController = new AIAgentController(window.gameManager, window.aiAgent, {
    delay: 300,
    depth: 2
  });
});
