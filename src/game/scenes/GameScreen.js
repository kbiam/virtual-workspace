import { EventBus } from "../EventBus";
import { Scene } from "phaser";

export class GameScreen extends Scene
{
    logoTween;

    constructor ()
    {
        super('GameScreen');
    }

    moveShip(ship,speed){
        ship.y += speed
        if(ship.y > this.sys.game.config.height){
            this.resetShipPos(ship)
        }
    }
    resetShipPos(ship){
        ship.y = 0;
        var randomX = Phaser.Math.Between(0, this.sys.game.config.width)
        ship.x = randomX;
    }
    destroyShip(pointer, gameObject)
    {
        gameObject.setTexture('explosion')
        gameObject.play('explosion_anim')
    }
    create()
    {
            this.bg = this.add.tileSprite(0,0,this.sys.game.config.height,this.sys.game.config.height,'gameBg').setScale(2.2,2)
            this.ship1 = this.add.sprite(300,0,'ship1').setScale(3)
            this.ship2 = this.add.sprite(400,0,'ship2').setScale(2)
            this.ship3 = this.add.sprite(500,0,'ship3').setScale(2)

            this.anims.create({
                key: 'ship1_anim',
                frames: this.anims.generateFrameNumbers('ship1'),
                frameRate: 20,
                repeat:-1
            })
            this.anims.create({
                key: 'ship2_anim',
                frames: this.anims.generateFrameNumbers('ship2'),
                frameRate: 20,
                repeat:-1
            })
            this.anims.create({
                key: 'ship3_anim',
                frames: this.anims.generateFrameNumbers('ship3'),
                frameRate: 20,
                repeat:-1
            })
            this.anims.create({
                key: 'explosion_anim',
                frames: this.anims.generateFrameNumbers('explosion'),
                frameRate: 20,
                repeat:0,
                hideOnComplete:true
            })

            this.ship1.play("ship1_anim")
            this.ship2.play("ship2_anim")
            this.ship3.play("ship3_anim")

            this.ship1.setInteractive()
            this.ship2.setInteractive()
            this.ship3.setInteractive()

            this.input.on('gameobjectdown',this.destroyShip,this)

            //power-up
            this.anims.create({
                key:"red",
                frames: this.anims.generateFrameNumbers("power-up",{
                    start:0,
                    end:1,
        
                }),
                frameRate:20,
                repeat:-1
            })
            this.anims.create({
                key:"grey",
                frames:this.anims.generateFrameNumbers("power-up",{
                    start:2,
                    end:3
                }),
                frameRate:20,
                repeat:-1
            })
            this.powerUps = this.physics.add.group();

            var maxObjects = 4
            for(var i = 0; i<=maxObjects;i++){
                var powerUp = this.physics.add.sprite(0,0,"power-up").setScale(2)
                this.powerUps.add(powerUp)
                powerUp.setRandomPosition(0,0,this.sys.game.config.width,this.sys.game.config.height)

                if(Math.random()>0.5){
                    powerUp.play("red")
                }
                else{
                    powerUp.play("grey")
                }

                powerUp.setVelocity(100,100)

                powerUp.setCollideWorldBounds(true)
                powerUp.setBounce(1)
            }
        }
        

    update()
    {
        this.moveShip(this.ship1,1)
        this.moveShip(this.ship2,2)
        this.moveShip(this.ship3,3)
        this.bg.tilePositionY -=0.5
    }
    changeScene()
    {
        this.scene.start('ParallaxScreen')
    }
}