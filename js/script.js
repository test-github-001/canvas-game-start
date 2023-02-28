'use strict';

/*************************
 * 
 *   ПОДГОТОВКА ХОЛСТА
 */

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

let vw, vh, vcx, vcy;
const scale = 2;
const canvasTegWidth = 800;
const canvasTegHeight = 600;

canvas.width = vw = canvasTegWidth * scale;
canvas.height = vh = canvasTegHeight * scale;
canvas.style.width = canvasTegWidth + 'px';
canvas.style.height = canvasTegHeight + 'px';
vcx = Math.floor(vw / 2);
vcy = Math.floor(vh / 2);

// массив файлов загрузки
let loadingsArr = [];

// старт игры
let isGameStart = false;

/*************************
 * 
 *   ЗАГРУЗКА ЗВУКОВ
 */

// путь к файлам звуков
const SOUNDS_PATH = './src/sounds/';

const BG_MUSIC = new Audio();
const SE_GAME = new Audio();
const SE_PLAYER = new Audio();

let seGameSourcesArr = [
    'se_explosion',
    'se_target'
];

let sePlayerSourcesArr = [
    'se_beep',
    'se_laser'
];

function playSeGame(sound) {
    SE_GAME.src = SOUNDS_PATH + sound +'.mp3';
    SE_GAME.play();
}

function playSePlayer(sound) {
    SE_PLAYER.src = SOUNDS_PATH + sound +'.mp3';
    SE_PLAYER.play();
}

const bgMusicsArr = ['bgm_deep_space', 'bgm_space'];
let bgMusicIndex = 0;

function playBgMusic() {
    BG_MUSIC.src = SOUNDS_PATH + bgMusicsArr[bgMusicIndex] + '.mp3';
    BG_MUSIC.play();
    bgMusicIndex++;
    if (bgMusicIndex === bgMusicsArr.length) bgMusicIndex = 0;
    BG_MUSIC.addEventListener('ended', playBgMusic);
}

/*************************
 * 
 *   ЗАГРУЗКА СПРАЙТОВ
 */

// путь к файлам спрайтов
const SPRITES_PATH = './src/sprites/';

class Sprite {
    constructor(src, width, height, frames) {
        this.img = new Image();
        this.img.src = SPRITES_PATH + src;
        this.frames = frames;
        this.frameWidth = Math.round(width / frames);
        this.frameHeight = height;
        this.isLoaded = false;
        this.img.onload = () => {
            this.isLoaded = true;
            loadingsArr = loadingsArr.filter( sprite => !sprite.isLoaded );
            if (loadingsArr.length === 0) gameReady();
            else console.log(loadingsArr);
        };
        loadingsArr.push(this);
    }
}

//                                                           scr, frames, width, height                
const asteroid_gold = new Sprite ('asteroid_gold_2550x100_30frames.png', 2550, 100, 30);
const rock_gold = new Sprite ('rock_gold_408x51_8frames.png', 408, 51, 8);

const asteroid_iron = new Sprite ('asteroid_iron_2639x109_29frames.png', 2639, 109, 29);
const rock_iron = new Sprite ('rock_iron_408x51_8frames.png', 408, 51, 8);

const asteroid_calcium = new Sprite ('asteroid_calcium_8192x128_64frames.png', 8192, 128, 64);
const rock_calcium = new Sprite ('rock_calcium_408x51_8frames.png', 408, 51, 8);

const asteroid_carbon = new Sprite ('asteroid_carbon_8192x128_64frames.png', 8192, 128, 64);
const rock_carbon = new Sprite ('rock_carbon_408x51_8frames.png', 408, 51, 8);

const asteroid_ice = new Sprite ('asteroid_ice_8192x128_64frames.png', 8192, 128, 64);
const rock_ice = new Sprite ('rock_ice_408x51_8frames.png', 408, 51, 8);

const asteroid_silicon = new Sprite ('asteroid_silicon_8192x128_64frames.png', 8192, 128, 64);
const rock_silicon = new Sprite ('rock_silicon_408x51_8frames.png', 408, 51, 8);

// курсор прицела
const cursor = new Sprite ('cursor_840x120_7frames.png', 840, 120, 7);
cursor.isReady = false;
cursor.frameX = 0;
cursor.lastFrame = cursor.frames - 1 ;
cursor.reloadTimeout = 7 * (1000 / cursor.frames);
cursor.reserveTime= 0;

cursor.draw = function( frameTimeout ) {
    if ( !this.isReady ) {
        this.reserveTime += frameTimeout;

        if ( this.reserveTime > this.reloadTimeout ) {
            this.frameX++;
            this.reserveTime -= this.reloadTimeout;

            if ( this.frameX === this.lastFrame ) {
                this.reserveTime= 0;
                this.isReady = true;
            }
        }
    }

    ctx.drawImage(
        this.img,    // Объект Image или canvas 
        this.frameX * this.frameWidth, // позиция X прямоуголника начала спрайта
        0, // позиция Y прямоуголника начала спрайта
        120, // ширена прямоуголника отображаемой части спрайта
        120, // высота прямоуголника отображаемой части спрайта
        mouseX - 60, // позиция X начала отобрадения спрайта на canvas
        mouseY - 60, // позиция Y начала отобрадения спрайта на canvas
        120, // ширина для отобрадения спрайта на canvas
        120  // высота для начала отобрадения спрайта на canvas
    );
}

// мушка вооружения
const aim = new Sprite ('aim.png', 120, 120, 1);

aim.x = vcx;
aim.y = vcy;
aim.speed = 300 / 1000;

aim.draw = function( frameTimeout ) {

    let speed = this.speed * frameTimeout;
    let dx = mouseX - this.x;
    let dy = mouseY - this.y;

    let distance = Math.sqrt( Math.pow( dx, 2) + Math.pow( dy, 2) );
    let path = speed / distance;

    if (path < 1) {
        this.x += dx * path;
        this.y += dy * path;
    } else {
        this.x = mouseX;
        this.y = mouseY;
    }

    ctx.drawImage(
        this.img,    // Объект Image или canvas 
        0, // позиция X прямоуголника начала спрайта
        0, // позиция Y прямоуголника начала спрайта
        120, // ширена прямоуголника отображаемой части спрайта
        120, // высота прямоуголника отображаемой части спрайта
        this.x - 60, // позиция X начала отобрадения спрайта на canvas
        this.y - 60, // позиция Y начала отобрадения спрайта на canvas
        120, // ширина для отобрадения спрайта на canvas
        120  // высота для начала отобрадения спрайта на canvas
    );
}

// класс и конструктор
class Asteroid {
    constructor(x, y, image, spin) {
        this.x = x;
        this.y = y;
        this.img = image.img;
        this.frameSpin = spin || 1; // 1, 2 or 3
        this.frames = image.frames;
        this.frameW = image.frameWidth;
        this.frameH = image.frameHeight;
        this.frameCX = Math.floor(this.frameW / 2);
        this.frameCY = Math.floor(this.frameH / 2);
        this.frame = 0;
        this.frameX = 0;
        this.frameY = 0;
        this.exist = true;
    }

    draw( FPSRatio, frame ) {
        ctx.drawImage(
            this.img,    // Объект Image или canvas 
            this.frameX, // позиция X прямоуголника начала спрайта
            this.frameY, // позиция Y прямоуголника начала спрайта
            this.frameW, // ширена прямоуголника отображаемой части спрайта
            this.frameH, // высота прямоуголника отображаемой части спрайта
            this.x - this.frameCX, // позиция X начала отобрадения спрайта на canvas
            this.y - this.frameCY, // позиция Y начала отобрадения спрайта на canvas
            this.frameW, // ширина для отобрадения спрайта на canvas
            this.frameH  // высота для начала отобрадения спрайта на canvas
        );
        // проверка переключения кадра и переход в начало, если это был последний кадр
        if (frame % this.frameSpin === 0) this.frame++
        if (this.frame === this.frames) this.frame = 0;
        this.frameX = this.frameW * this.frame;
    }
}
// массив объектов
let asteroidsArr = [];
asteroidsArr.push( new Asteroid(vcx - 350, vcy - 100, asteroid_gold, 3) );
asteroidsArr.push( new Asteroid(vcx - 210, vcy - 100, asteroid_iron, 3) );
asteroidsArr.push( new Asteroid(vcx -  70, vcy - 100, asteroid_calcium, 3) );
asteroidsArr.push( new Asteroid(vcx +  70, vcy - 100, asteroid_carbon, 3) );
asteroidsArr.push( new Asteroid(vcx + 210, vcy - 100, asteroid_ice, 3) );
asteroidsArr.push( new Asteroid(vcx + 350, vcy - 100, asteroid_silicon, 3) );

asteroidsArr.push( new Asteroid(vcx - 350, vcy + 100, rock_gold, 2) );
asteroidsArr.push( new Asteroid(vcx - 210, vcy + 100, rock_iron, 2) );
asteroidsArr.push( new Asteroid(vcx -  70, vcy + 100, rock_calcium, 2) );
asteroidsArr.push( new Asteroid(vcx +  70, vcy + 100, rock_carbon, 2) );
asteroidsArr.push( new Asteroid(vcx + 210, vcy + 100, rock_ice, 2) );
asteroidsArr.push( new Asteroid(vcx + 350, vcy + 100, rock_silicon, 2) );


/*********************************
 * 
 *  ГЕНЕРАТОР СЛУЧАЙНЫХ ЧИСЕЛ
 */

// min - минимальное число (можно дробное)
// max - максимальное число (можно дробное)
// roundSize - сколько оставить знаков после точки
// (roundSize - если не передать, возвращаются целые числа)
function getRandom(min, max, roundSize) {
    let result = (Math.random() * (max - min) + min);
    result = result.toFixed(roundSize);
    return parseFloat(result);
}

/***********************************************
 * 
 *  РАСЧЕТ РАССТОЯНИЯ МЕЖДУ ДВУМЯ ТОЧКАМИ
 */

function getDistance (x1, y1, x2, y2) {
    return Math.sqrt( Math.pow( (x1 - x2), 2) + Math.pow( (y1 - y2), 2) );
}

/******************************************
 * 
 *  ОТСЛЕЖИВАНИЕ ПОЛОЖЕНИЯ КУРСОРА МЫШИ
 */

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
        y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
    };
}

let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;

canvas.addEventListener('mousemove', function(evt) {
    let mouse = getMousePos(canvas, evt);
    mouseX = mouse.x;
    mouseY = mouse.y;
}, false);

/******************************************
 * 
 *  ОТСЛЕЖИВАНИЕ КЛИКОВ ЛЕВОЙ КНОПКОЙ
 */

document.addEventListener('click', () => {
    if (cursor.isReady) {
        playSePlayer( 'se_laser' );
        cursor.frameX = 0;
        cursor.isReady = false;
    }
    /*
    if (counter_click % 2 === 0) {
        let sound = Math.random() < 0.5 ? 'se_explosion' :'se_target';
        playSeGame(sound);
    } else {
        let sound = Math.random() < 0.5 ? 'se_beep' :'se_laser';
        playSePlayer(sound);
    }
    */
});

/**************
 * 
 *  АНИМАЦИЯ
 */

// проверка производительности
let testPerformanceArray = [];

// номер текущего кадра
let frame = 0;
// временная метка последнего кадра
let previousTimeStamp = 0;

function animation( timeStamp ) {
    // обновляем временные метки
    const frameTimeout = timeStamp - previousTimeStamp;
    previousTimeStamp = timeStamp;

    // обновляем номер кадра
    frame++;

    // чистим холст
    ctx.clearRect(0, 0, vw, vh);

    // обнавляем астеройды
    asteroidsArr.forEach( asteroid => asteroid.draw( frameTimeout, frame ) );

    // рисуем прицел и курсор
    aim.draw( frameTimeout );
    cursor.draw( frameTimeout );

    // удаляем снежинки которые улутули за пределы холста
    asteroidsArr = asteroidsArr.filter( asteroid => asteroid.exist );
    
    // обновляем данные по производительности
    testPerformanceArray.push( frameTimeout );
    // выводим в консоль инвормацию производительности и о количестве снежинок на экране каждеы 60 кадров
    if (frame % 60 === 0) {
        let maxTimeout = Math.max( ...testPerformanceArray );
        let sumTimeout = testPerformanceArray.reduce((sum, data) => data + sum, 0);
        let midTimeout = sumTimeout / testPerformanceArray.length;
        testPerformanceArray = [];

        console.clear(); // очистка старой информации
        console.group('ПРОИЗВОДИТЕЛЬНОСТЬ')
        console.log('мин.FPS:', (1000 / maxTimeout).toFixed(3) + ' (из 60)');
        console.log(' ср.FPS:', (1000 / midTimeout).toFixed(3) + ' (из 60)');
        console.groupEnd()
    }

    // запускаем занова анимацию с 60 fps
    requestAnimationFrame( animation );
}

function gameReady() {
    console.log('ALL SOURCES IS LOADED');
    
    const startButton = document.createElement('div');
    startButton.id = 'startButton';
    startButton.innerText = 'START';
    startButton.onclick = gameStart;
    document.body.append(startButton);
}

function gameStart() {
    document.getElementById('startButton').remove();

    document.body.prepend(canvas);

    // запускаем анимацию с 60 fps
    requestAnimationFrame( animation );

    isGameStart = true;
    playBgMusic();
}