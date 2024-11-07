import { Boot } from './scenes/Boot';
import { Game } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import { MainMenu } from './scenes/MainMenu';
import Phaser from 'phaser';
import { Preloader } from './scenes/Preloader';
import { GameScreen } from './scenes/GameScreen';
import { ParallaxScreen } from './scenes/ParallaxScreen';
import { RPGGame } from './scenes/RPGGame';
import { UsernameInputScene } from './scenes/UsernameInputScene';

// Find out more information about the Game Config at:
// https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config = {
    type: Phaser.AUTO,
    // width: 576,
    // height: 360,
    width:1250,
    height:700,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scene: [
        Boot,
        Preloader,
        MainMenu,
        Game,
        GameOver,
        GameScreen,
        ParallaxScreen,
        RPGGame,
        UsernameInputScene
    ],
    physics:{
        default:"arcade",
        arcade:{
            debug:false,
            gravity:{y:0}
        }
    }
};

const StartGame = (parent) => {

    return new Phaser.Game({ ...config, parent });

}

export default StartGame;
