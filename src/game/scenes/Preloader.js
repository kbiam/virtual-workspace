import { Scene } from 'phaser';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(512, 384, 'background');

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    // preload ()
    // {
    //     //  Load the assets for the game - Replace with your own assets
    //     this.load.setPath('assets');
    //     this.load.image('gameBg','bgg.png')
    //     this.load.image('logo', 'logo.png');
    //     this.load.image('star', 'star.png');
    //     // this.load.image('ship1','ship.png')
    //     this.load.spritesheet("ship1",'/spritesheets/ship.png',{
    //         frameWidth:16,
    //         frameHeight:16
    //     })
    //     this.load.spritesheet("ship2",'/spritesheets/ship2.png',{
    //         frameWidth:32,
    //         frameHeight:16
    //     })
    //     this.load.spritesheet("ship3",'/spritesheets/ship3.png',{
    //         frameWidth:32,
    //         frameHeight:32
    //     })
    //     this.load.spritesheet("explosion",'/spritesheets/explosion.png',{
    //         frameWidth:16,
    //         frameHeight:16
    //     })
    //     this.load.spritesheet("power-up",'power-up.png',{
    //         frameWidth:16,
    //         frameHeight:16
    //     })
    //     // this.load.image('ship2','ship2.png')
    //     // this.load.image('ship3','ship3.png')
    //     //Parallax

    //     this.load.image("Parallaxbg",'/parallax/bg-1.png')
    //     this.load.image("bg_2",'/parallax/bg-2.png')
    //     this.load.spritesheet("bee",'/parallax/bee.png',{
    //         frameWidth:37,
    //         frameHeight:39
    //     })
    //     this.load.image("ground",'/parallax/ground.png')
    // }
    preload()
    {
        this.load.setPath('assets');
        this.load.image("tiles","tiled/tuxmon-sample-32px-extruded.png")
        this.load.tilemapTiledJSON("map","tiled/tuxemon-town.json")

        this.load.spritesheet("sprite-left",'tiled/spritesheet-left.png',{
            frameWidth:16,
            frameHeight:32
        })
        this.load.spritesheet("sprite-right",'tiled/spritesheet-right.png',{
            frameWidth:16,
            frameHeight:32
        })
        this.load.spritesheet("sprite-front",'tiled/spritesheet-front.png',{
            frameWidth:16,
            frameHeight:32
        })
        this.load.spritesheet("sprite-back",'tiled/spritesheet-back.png',{
            frameWidth:16,
            frameHeight:32
        })
        this.load.spritesheet("normal",'tiled/misa-front.png',{
            frameWidth:16,frameHeight:32
        })
    }

    create ()
    {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('UsernameInputScene');
    }
}
