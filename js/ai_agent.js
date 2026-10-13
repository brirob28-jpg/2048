function AIAgent(size) {
  this.size = size || 4;
  this.defaultDepth = 2;
}

AIAgent.prototype.copyBoard = function (gridOrBoard) {
  var board = [];
  var source = gridOrBoard.cells || gridOrBoard;

  for (var x = 0; x < this.size; x++) {
    board[x] = [];

    for (var y = 0; y < this.size; y++) {
      var cell = source[x][y];
      board[x][y] = cell ? cell.value || cell : 0;
    }
  }

  return board;
};

AIAgent.prototype.simulateMove = function (gridOrBoard, direction) {
  var board = this.copyBoard(gridOrBoard);
  var result = this.emptyBoard();
  var moved = false;
  var scoreGained = 0;

  for (var index = 0; index < this.size; index++) {
    var line = this.getLine(board, direction, index);
    var merged = this.mergeLine(line);

    scoreGained += merged.score;
    this.setLine(result, direction, index, merged.line);

    if (!this.linesEqual(line, merged.line)) {
      moved = true;
    }
  }

  return {
    board: result,
    moved: moved,
    scoreGained: scoreGained
  };
};

AIAgent.prototype.getLegalMoves = function (gridOrBoard) {
  var moves = [];

  for (var direction = 0; direction < 4; direction++) {
    var simulation = this.simulateMove(gridOrBoard, direction);

    if (simulation.moved) {
      moves.push({
        direction: direction,
        board: simulation.board,
        scoreGained: simulation.scoreGained
      });
    }
  }

  return moves;
};

AIAgent.prototype.evaluateBoard = function (gridOrBoard) {
  var board = this.copyBoard(gridOrBoard);
  var weights = {
    emptyCells: 1000,
    mergeOpportunities: 250,
    monotonicity: 20,
    smoothness: 8,
    maxTileInCorner: 2000
  };

  return (this.countEmptyCells(board) * weights.emptyCells) +
         (this.countMergeOpportunities(board) * weights.mergeOpportunities) +
         (this.calculateMonotonicity(board) * weights.monotonicity) -
         (this.calculateSmoothnessPenalty(board) * weights.smoothness) +
         (this.isMaxTileInCorner(board) ? weights.maxTileInCorner : 0);
};

AIAgent.prototype.getBestMove = function (gridOrBoard, depth) {
  var searchDepth = depth || this.defaultDepth;
  var legalMoves = this.getLegalMoves(gridOrBoard);
  var bestMove = null;
  var bestScore = -Infinity;

  if (!legalMoves.length) {
    return null;
  }

  for (var i = 0; i < legalMoves.length; i++) {
    var move = legalMoves[i];
    var score = move.scoreGained +
                this.expectimaxChance(move.board, searchDepth - 1);

    if (score > bestScore) {
      bestScore = score;
      bestMove = move.direction;
    }
  }

  return bestMove;
};

AIAgent.prototype.expectimaxMax = function (gridOrBoard, depth) {
  var board = this.copyBoard(gridOrBoard);

  if (depth <= 0) {
    return this.evaluateBoard(board);
  }

  var legalMoves = this.getLegalMoves(board);

  if (!legalMoves.length) {
    return this.evaluateBoard(board);
  }

  var bestScore = -Infinity;

  for (var i = 0; i < legalMoves.length; i++) {
    var move = legalMoves[i];
    var score = move.scoreGained +
                this.expectimaxChance(move.board, depth - 1);

    if (score > bestScore) {
      bestScore = score;
    }
  }

  return bestScore;
};

AIAgent.prototype.expectimaxChance = function (gridOrBoard, depth) {
  var board = this.copyBoard(gridOrBoard);
  var emptyCells = this.getEmptyCells(board);

  if (!emptyCells.length) {
    return this.expectimaxMax(board, depth);
  }

  var expectedScore = 0;
  var cellProbability = 1 / emptyCells.length;

  for (var i = 0; i < emptyCells.length; i++) {
    var cell = emptyCells[i];
    var boardWithTwo = this.boardWithAddedTile(board, cell, 2);
    var boardWithFour = this.boardWithAddedTile(board, cell, 4);

    expectedScore += cellProbability * 0.9 *
                     this.expectimaxMax(boardWithTwo, depth);
    expectedScore += cellProbability * 0.1 *
                     this.expectimaxMax(boardWithFour, depth);
  }

  return expectedScore;
};

AIAgent.prototype.emptyBoard = function () {
  var board = [];

  for (var x = 0; x < this.size; x++) {
    board[x] = [];

    for (var y = 0; y < this.size; y++) {
      board[x][y] = 0;
    }
  }

  return board;
};

AIAgent.prototype.getLine = function (board, direction, index) {
  var line = [];
  var position;

  for (var offset = 0; offset < this.size; offset++) {
    position = this.positionForLine(direction, index, offset);
    line.push(board[position.x][position.y]);
  }

  return line;
};

AIAgent.prototype.setLine = function (board, direction, index, line) {
  var position;

  for (var offset = 0; offset < this.size; offset++) {
    position = this.positionForLine(direction, index, offset);
    board[position.x][position.y] = line[offset];
  }
};

AIAgent.prototype.positionForLine = function (direction, index, offset) {
  if (direction === 0) {
    return { x: index, y: offset };
  } else if (direction === 1) {
    return { x: this.size - 1 - offset, y: index };
  } else if (direction === 2) {
    return { x: index, y: this.size - 1 - offset };
  } else {
    return { x: offset, y: index };
  }
};

AIAgent.prototype.mergeLine = function (line) {
  var values = [];
  var merged = [];
  var score = 0;

  for (var i = 0; i < line.length; i++) {
    if (line[i]) {
      values.push(line[i]);
    }
  }

  for (var j = 0; j < values.length; j++) {
    if (values[j] === values[j + 1]) {
      var mergedValue = values[j] * 2;
      merged.push(mergedValue);
      score += mergedValue;
      j++;
    } else {
      merged.push(values[j]);
    }
  }

  while (merged.length < this.size) {
    merged.push(0);
  }

  return {
    line: merged,
    score: score
  };
};

AIAgent.prototype.linesEqual = function (first, second) {
  for (var i = 0; i < first.length; i++) {
    if (first[i] !== second[i]) {
      return false;
    }
  }

  return true;
};

AIAgent.prototype.countEmptyCells = function (board) {
  var emptyCells = 0;

  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      if (!board[x][y]) {
        emptyCells++;
      }
    }
  }

  return emptyCells;
};

AIAgent.prototype.getEmptyCells = function (gridOrBoard) {
  var board = this.copyBoard(gridOrBoard);
  var emptyCells = [];

  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      if (!board[x][y]) {
        emptyCells.push({ x: x, y: y });
      }
    }
  }

  return emptyCells;
};

AIAgent.prototype.boardWithAddedTile = function (gridOrBoard, cell, value) {
  var board = this.copyBoard(gridOrBoard);
  board[cell.x][cell.y] = value;

  return board;
};

AIAgent.prototype.countMergeOpportunities = function (board) {
  var merges = 0;

  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      if (!board[x][y]) {
        continue;
      }

      if (x + 1 < this.size && board[x][y] === board[x + 1][y]) {
        merges++;
      }

      if (y + 1 < this.size && board[x][y] === board[x][y + 1]) {
        merges++;
      }
    }
  }

  return merges;
};

AIAgent.prototype.calculateMonotonicity = function (board) {
  var rowScore = 0;
  var columnScore = 0;

  for (var y = 0; y < this.size; y++) {
    var row = [];

    for (var x = 0; x < this.size; x++) {
      row.push(board[x][y]);
    }

    rowScore += this.bestMonotonicLineScore(row);
  }

  for (var x = 0; x < this.size; x++) {
    columnScore += this.bestMonotonicLineScore(board[x]);
  }

  return rowScore + columnScore;
};

AIAgent.prototype.bestMonotonicLineScore = function (line) {
  var increasing = 0;
  var decreasing = 0;

  for (var i = 0; i < line.length - 1; i++) {
    var current = this.tileRank(line[i]);
    var next = this.tileRank(line[i + 1]);

    if (current <= next) {
      increasing++;
    }

    if (current >= next) {
      decreasing++;
    }
  }

  return Math.max(increasing, decreasing);
};

AIAgent.prototype.calculateSmoothnessPenalty = function (board) {
  var penalty = 0;

  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      if (!board[x][y]) {
        continue;
      }

      if (x + 1 < this.size && board[x + 1][y]) {
        penalty += Math.abs(this.tileRank(board[x][y]) -
                            this.tileRank(board[x + 1][y]));
      }

      if (y + 1 < this.size && board[x][y + 1]) {
        penalty += Math.abs(this.tileRank(board[x][y]) -
                            this.tileRank(board[x][y + 1]));
      }
    }
  }

  return penalty;
};

AIAgent.prototype.isMaxTileInCorner = function (board) {
  var maxTile = 0;

  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      if (board[x][y] > maxTile) {
        maxTile = board[x][y];
      }
    }
  }

  return board[0][0] === maxTile ||
         board[0][this.size - 1] === maxTile ||
         board[this.size - 1][0] === maxTile ||
         board[this.size - 1][this.size - 1] === maxTile;
};

AIAgent.prototype.tileRank = function (value) {
  return value ? Math.log(value) / Math.log(2) : 0;
};

function AIAgentController(gameManager, aiAgent, options) {
  this.gameManager = gameManager;
  this.aiAgent = aiAgent;
  this.delay = options && options.delay || 300;
  this.depth = options && options.depth || this.aiAgent.defaultDepth;
  this.running = false;
  this.calculating = false;
  this.timer = null;

  this.startButton = document.querySelector(".ai-start-button");
  this.pauseButton = document.querySelector(".ai-pause-button");
  this.restartButton = document.querySelector(".restart-button");
  this.gameContainer = document.querySelector(".game-container");

  this.bindControls();
  this.bindManualInputLock();
  this.updateButtons();
}

AIAgentController.prototype.bindControls = function () {
  var self = this;

  if (this.startButton) {
    this.startButton.addEventListener("click", function (event) {
      event.preventDefault();
      self.start();
    });
  }

  if (this.pauseButton) {
    this.pauseButton.addEventListener("click", function (event) {
      event.preventDefault();
      self.pause();
    });
  }

  if (this.restartButton) {
    this.restartButton.addEventListener("click", function () {
      self.pause();
    }, true);

    this.restartButton.addEventListener("touchend", function () {
      self.pause();
    }, true);
  }
};

AIAgentController.prototype.bindManualInputLock = function () {
  var self = this;
  var movementKeys = {
    37: true,
    38: true,
    39: true,
    40: true,
    65: true,
    68: true,
    72: true,
    74: true,
    75: true,
    76: true,
    83: true,
    87: true
  };

  document.addEventListener("keydown", function (event) {
    if (self.running && movementKeys[event.which]) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  if (this.gameContainer) {
    var blockSwipe = function (event) {
      if (self.running) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    this.gameContainer.addEventListener("touchstart", blockSwipe, true);
    this.gameContainer.addEventListener("touchmove", blockSwipe, true);
    this.gameContainer.addEventListener("touchend", blockSwipe, true);
    this.gameContainer.addEventListener("MSPointerDown", blockSwipe, true);
    this.gameContainer.addEventListener("MSPointerMove", blockSwipe, true);
    this.gameContainer.addEventListener("MSPointerUp", blockSwipe, true);
  }
};

AIAgentController.prototype.start = function () {
  if (this.running) {
    return;
  }

  this.running = true;
  this.updateButtons();
  this.scheduleNextMove(0);
};

AIAgentController.prototype.pause = function () {
  this.running = false;
  this.calculating = false;

  if (this.timer) {
    window.clearTimeout(this.timer);
    this.timer = null;
  }

  this.updateButtons();
};

AIAgentController.prototype.scheduleNextMove = function (delay) {
  var self = this;

  if (!this.running || this.timer) {
    return;
  }

  this.timer = window.setTimeout(function () {
    self.timer = null;
    self.playStep();
  }, delay);
};

AIAgentController.prototype.playStep = function () {
  if (!this.running || this.calculating) {
    return;
  }

  if (this.gameManager.isGameTerminated()) {
    this.pause();
    return;
  }

  this.calculating = true;
  var move = this.aiAgent.getBestMove(this.gameManager.grid, this.depth);
  this.calculating = false;

  if (move === null) {
    this.pause();
    return;
  }

  this.gameManager.move(move);

  if (this.gameManager.isGameTerminated()) {
    this.pause();
    return;
  }

  this.scheduleNextMove(this.delay);
};

AIAgentController.prototype.updateButtons = function () {
  if (this.startButton) {
    this.startButton.classList.toggle("ai-active", this.running);
  }

  if (this.pauseButton) {
    this.pauseButton.classList.toggle("ai-active", !this.running);
  }
};
