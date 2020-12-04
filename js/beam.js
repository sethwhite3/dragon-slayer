class Beam extends Phaser.GameObjects.Sprite {
    constructor(scene, position) {

        if (position == "up") {
            var x = scene.player.x;
            var y = scene.player.y -16;
        } else if (position == "down") {
            var x = scene.player.x;
            var y = scene.player.y + 16;
        } else if (position == "left") {
            var x = scene.player.x - 16;
            var y = scene.player.y;
        } else if (position == "right") {
            var x = scene.player.x + 16;
            var y = scene.player.y;
        } else {
            var x = scene.player.x;
            var y = scene.player.y + 16;
        }
        
        super(scene, x, y, "beam");
        scene.add.existing(this);

        this.play("beam_anim");
        scene.physics.world.enableBody(this);

        if (position == "up") {
            this.body.velocity.y = - 250;
        } else if (position == "down") {
            this.angle = 180;
            this.body.velocity.y = 250;
        } else if (position == "left") {
            this.angle = -90;
            this.body.velocity.x = -250;
        } else if (position == "right") {
            this.angle = 90;
            this.body.velocity.x = 250;
        } else {
            this.angle = 180;
            this.body.velocity.y = 250;
        }

        scene.projectiles.add(this);
    }

    update () {
        this.destroy();
    }
}