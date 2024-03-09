const mainDiv = document.getElementById('main')
const grid = document.getElementById('grid')

const pauseBtn = document.getElementById('pause-btn')
const minesCountText = document.getElementById('mines-count')

document.addEventListener('contextmenu', event => event.preventDefault())

let gridWidth = 12
let gridHeight = 12

let nMines
let totalMines
let nMinesDiscovered

let stopped
let paused
let firstClick

let squares
let mines

const MOUSE_BUTTONS = {
  LEFT: 0,
  RIGHT: 2
}

const FLAG_TYPES = {
  OK: 1,
  DOUBT: 2
}

class Square {
  constructor({ }) {
    this.mine = false
    this.discovered = false
    this.adjacentMines = 0
    this.flagType = undefined
  }
}

let seconds
let minutes
let hours

let interval

const appendSeconds = document.getElementById('seconds')
const appendMinutes = document.getElementById('minutes')
const appendHours = document.getElementById('hours')

const setInitialVariables = () => {
  stopped = false
  paused = false
  firstClick = true

  seconds = 0
  minutes = 0
  hours = 0

  nMines = 0
  nMinesDiscovered = 0

  pauseBtn.innerHTML = 'Пауза'
  grid.style.visibility = 'visible'

  squares = []
  mines = [[]]

  totalMines = 2 * Math.floor(Math.sqrt(gridHeight * gridWidth))
  grid.innerHTML = ''
  grid.style["grid-template-columns"] = "auto ".repeat(gridWidth)
}

const populateGrid = () => {
  for (let i = 0; i < gridHeight; i++) {
    mines[i] = []
    for (let j = 0; j < gridWidth; j++) {
      mines[i].push(new Square({}))
      const square = document.createElement('div')
      square.className = 'square'
      square.addEventListener('mousedown', (event) => {
        switch (event.button) {
          case MOUSE_BUTTONS.LEFT:
            checkMine(i, j)
            break;
          case MOUSE_BUTTONS.RIGHT:
            putFlag(i, j)

          default:
            break;
        }
      })
      squares.push(square)
      grid.appendChild(square)
    }
  }
}

const setMines = () => {
  let minesToPopulate = totalMines
  while (minesToPopulate > 0) {
    let i = Math.floor(Math.random() * gridHeight)
    let j = Math.floor(Math.random() * gridWidth)

    if (!mines[i][j].mine) {
      mines[i][j].mine = true
      minesToPopulate--
    }
  }
}

// Подсчёт количества соседних мин для каждой ячейки написала в лоб, а не через рекурсивную функцию, 
// т.к. так мне показалось проще (и оно работает:))
// Вложенные циклы for для перебора всех ячеек в двумерном массиве mines. Для каждой ячейки, которая не содержит мину, 
// проверяются все восемь соседних ячеек вокруг нее. Если соседняя ячейка содержит мину и находится в пределах 
// массива mines, счетчик n увеличивается на 1
const setAdjancentMines = () => {
  for (let i = 0; i < mines.length; i++) {
    for (let j = 0; j < mines[i].length; j++) {
      if (!mines[i][j].mine) {
        let n = 0
        if ((i - 1 >= 0) && (j - 1 >= 0) && mines[i - 1][j - 1].mine) {
          n++
        }
        if ((i - 1 >= 0) && mines[i - 1][j].mine) {
          n++
        }
        if ((i - 1 >= 0) && (j + 1 < mines[i].length) && mines[i - 1][j + 1].mine) {
          n++
        }
        if ((j - 1 >= 0) && mines[i][j - 1].mine) {
          n++
        }
        if ((j + 1 < mines[i].length) && mines[i][j + 1].mine) {
          n++
        }
        if ((i + 1 < mines.length) && (j - 1 >= 0) && mines[i + 1][j - 1].mine) {
          n++
        }
        if ((i + 1) < mines.length && mines[i + 1][j].mine) {
          n++
        }
        if ((i + 1 < mines.length) && (j + 1 < mines[i].length) && mines[i + 1][j + 1].mine) {
          n++
        }
        mines[i][j].adjacentMines = n
      }
    }
  }
}

const checkMine = (i, j) => {
  if (stopped) return
  if (firstClick) {
    firstClick = false
    startTimer()
  }
  if (mines[i][j].flagType === FLAG_TYPES.OK) {
    return
  }
  if (mines[i][j].mine) {
    blow()
    stopped = true
  } else {
    floodFill(i, j)
  }
}

// Функция раскрытия ячеек вокруг выбранной ячейки без мин через рекурсию, пока не будут открыты все 
// соседние ячейки без мин или не будет достигнута граница минного поля
const floodFill = (i, j) => {
  if (mines[i][j].discovered || mines[i][j].mine) {
    return
  } else {
    mines[i][j].discovered = true
    squares[i * gridWidth + j].style.background = "#AFC7DB"
    nMinesDiscovered++
    if (nMinesDiscovered === gridWidth * gridHeight - totalMines) {
      alert("Вы выиграли! Нажмите \"Новая игра\", чтобы начать заново! :)")
      stopped = true
    }
    if (mines[i][j].adjacentMines != 0) {
      squares[i * gridWidth + j].innerText = mines[i][j].adjacentMines
      return
    }
  }
  if ((i - 1 >= 0) && (j - 1 >= 0)) {
    floodFill(i - 1, j - 1)
  }
  if (i - 1 >= 0) {
    floodFill(i - 1, j)
  }
  if ((i - 1 >= 0) && (j + 1 < mines[i].length)) {
    floodFill(i - 1, j + 1)
  }
  if (j - 1 >= 0) {
    floodFill(i, j - 1)
  }
  if (j + 1 < mines[i].length) {
    floodFill(i, j + 1)
  }
  if ((i + 1 < mines.length) && (j - 1 >= 0)) {
    floodFill(i + 1, j - 1)
  }
  if ((i + 1 < mines.length)) {
    floodFill(i + 1, j)
  }
  if ((i + 1 < mines.length) && (j + 1 < mines[i].length)) {
    floodFill(i + 1, j + 1)
  }
  return
}


const blow = () => {
  for (let i = 0; i < mines.length; i++) {
    for (let j = 0; j < mines[i].length; j++) {
      if (mines[i][j].mine) {
        const bombImg = document.createElement('img')
        bombImg.src = './images/bomb.png'
        squares[i * gridWidth + j].innerHTML = ''
        squares[i * gridWidth + j].appendChild(bombImg)
      }
    }
  }
}

const putFlag = (i, j) => {
  if (!mines[i][j].flagType) {
    const flagImg = document.createElement('img')
    flagImg.src = './images/flag_ok.png'
    squares[i * gridWidth + j].appendChild(flagImg)
    nMines++
    minesCountText.innerText = `${nMines}/${totalMines}`
    mines[i][j].flagType = FLAG_TYPES.OK
  } else if (mines[i][j].flagType === FLAG_TYPES.OK) {
    const flagDoubtImg = document.createElement('img')
    flagDoubtImg.src = './images/flag_doubt.png'
    squares[i * gridWidth + j].innerHTML = ''
    squares[i * gridWidth + j].appendChild(flagDoubtImg)
    nMines--
    minesCountText.innerText = `${nMines}/${totalMines}`
    mines[i][j].flagType = FLAG_TYPES.DOUBT
  } else if (mines[i][j].flagType === FLAG_TYPES.DOUBT) {
    squares[i * gridWidth + j].innerHTML = ''
    mines[i][j].flagType = undefined
  }
}

const stopwatch = () => {
  if (!paused && !stopped) {
    seconds++
  }

  if (seconds <= 9) {
    appendSeconds.innerHTML = "0" + seconds
  }
  if (seconds > 9 && seconds < 60) {
    appendSeconds.innerHTML = seconds
  }
  if (seconds > 59) {
    seconds = 0
    appendSeconds.innerHTML = seconds
    minutes++
  }

  if (minutes <= 9) {
    appendMinutes.innerHTML = "0" + minutes
  }
  if (minutes > 9 && minutes < 60) {
    appendMinutes.innerHTML = minutes
  }
  if (minutes > 59) {
    minutes = 0
    appendMinutes.innerHTML = minutes
    minutes++
  }

  if (hours <= 9) {
    appendHours.innerHTML = "0" + hours
  }
  if (hours > 9 && hours < 60) {
    appendHours.innerHTML = hours
  }
  if (hours > 59) {
    hours = 0
    appendHours.innerHTML = hours
    hours++
  }
}

const clearStopwatch = () => {
  appendSeconds.innerHTML = "00"
  appendMinutes.innerHTML = "00"
  appendHours.innerHTML = "00"
}

const startTimer = () => {
  clearInterval(interval)
  interval = setInterval(stopwatch, 1000)
}

const pause = () => {
  paused = !paused
  if (paused) {
    pauseBtn.innerHTML = 'Продолжить'
    grid.style.visibility = 'hidden'
  } else {
    pauseBtn.innerHTML = 'Пауза'
    grid.style.visibility = 'visible'
  }
}

const newGame = () => {
  const size = document.getElementById('sizeGrid')
  switch (size.value) {
    case 'small':
      gridWidth = 12
      gridHeight = 12
      break;
    case 'medium':
      gridWidth = 16
      gridHeight = 16
      break;
    case 'large':
      gridWidth = 20
      gridHeight = 20
      break;

    default:
      break;
  }
  startGame()
}

const startGame = () => {
  setInitialVariables()
  clearInterval(interval)
  clearStopwatch()
  populateGrid()
  setMines()
  setAdjancentMines()
}

startGame()
