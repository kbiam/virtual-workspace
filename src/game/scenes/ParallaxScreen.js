import { EventBus } from "../EventBus";
import { Scene } from "phaser";


export class ParallaxScreen extends Scene

{
    constructor()
    {
        super("ParallaxScreen")
    }
    
    create()
    {   
        this.bg = this.add.tileSprite(0,0,this.game.config.width,this.game.config.height,'Parallaxbg')
        this.bg.setOrigin(0, 0);

        this.bg.setScrollFactor(0)
        
            // Add a second background layer. Repeat as in bg_1
        this.bg_2 = this.add.tileSprite(0, 0, this.game.config.width, this.game.config.height, "bg_2").setScale(1.5)
        this.bg_2.setOrigin(0, 0);
        this.bg_2.setScrollFactor(0);

        this.ground = this.add.tileSprite(0,0,this.game.config.width,48,"ground")
        this.ground.setOrigin(0, 0);
        this.ground.setScrollFactor(0);
        this.ground.y = 312

        this.bee = this.add.sprite(100,100,'bee').setScale(1.5)
        this.anims.create({
            key:"bee",
            frames:this.anims.generateFrameNumbers('bee'),
            frameRate:20,
            repeat:-1
        })
        this.bee.play("bee")
        this.cursors = this.input.keyboard.createCursorKeys();

        this.myCam = this.cameras.main

        this.myCam.setBounds(0,0,this.game.config.width*3,this.game.config.height)
        this.myCam.startFollow(this.bee)

    }
    update()
    {
        if(this.cursors.left.isDown && this.bee.x > 0){
            this.bee.x -= 3
            this.bee.flipX = false;
        }
        if(this.cursors.right.isDown && this.bee.x < this.game.config.width*3){
            this.bee.x += 3
            this.bee.flipX = true;
        }
        this.bg.tilePositionX = this.myCam.scrollX * .3
        this.bg_2.tilePositionX = this.myCam.scrollX * .6
        this.ground.tilePositionX = this.myCam.scrollX;



    }
}