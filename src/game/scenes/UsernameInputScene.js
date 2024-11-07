import { Scene } from 'phaser';

export class UsernameInputScene extends Scene {
    constructor() {
        super({ key: 'UsernameInputScene' });
    }

    preload() {
        // Load any assets if needed for the input scene (optional)
    }

    create() {
        // Add a background or any visuals you want for the username input screen
        this.cameras.main.setBackgroundColor('black');
        this.add.text(625, 250, "Enter Your Username", { font: "36px monospace", fill: "#ffffff" }).setOrigin(0.5);
    
        // Create HTML elements for username input and submission button
        this.createUsernameInput();
    }

    createUsernameInput() {
        // Create a HTML input for the username
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Username';
        input.style.position = 'absolute';
        input.style.top = '50%';
        input.style.left = '50%';
        input.style.transform = 'translate(-50%, -50%)';
        input.style.padding = '12px';
        input.style.fontSize = '20px';
        input.style.borderRadius = '8px'
        document.body.appendChild(input);


        // Create a submit button
        const submitButton = document.createElement('button');
        submitButton.innerText = 'Enter';
        submitButton.style.position = 'absolute';
        submitButton.style.top = '60%';
        submitButton.style.left = '50%';
        submitButton.style.transform = 'translate(-50%, -50%)';
        submitButton.style.padding = '12px';
        submitButton.style.fontSize = '18px';
        submitButton.style.borderRadius = '8px'
        document.body.appendChild(submitButton);

        // Handle button click
        submitButton.addEventListener('click', () => {
            const username = input.value.trim();
            if (username) {
                // Store the username in the game or scene data
                this.game.username = username;

                // Clean up HTML elements
                document.body.removeChild(input);
                document.body.removeChild(submitButton);

                // Start the main game scene
                this.scene.start('RPGGame');
            }
        });

        input.addEventListener('keypress',(event)=>{
            if(event.key === 'Enter'){
                submitButton.click()
            }
        })
    }
}
