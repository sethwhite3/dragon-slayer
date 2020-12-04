var BootScene = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

    function BootScene ()
    {
        Phaser.Scene.call(this, { key: 'BootScene' });
    },

    preload: function ()
    {
        // map tiles
        this.load.image('tiles', 'assets/map/spritesheet.png');
        
        // map in json format
        this.load.tilemapTiledJSON('map', 'assets/map/map.json');
        
        // enemies
        this.load.image("dragonblue", "assets/dragonblue.png");
        this.load.image("dragonorrange", "assets/dragonorrange.png");
        
        // our characters
        this.load.spritesheet('player', 'assets/RPG_assets.png', { frameWidth: 16, frameHeight: 16 });
    },

    create: function ()
    {
        // start the WorldScene
        this.scene.start('WorldScene');
    }
});

var WorldScene = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

    function WorldScene ()
    {
        Phaser.Scene.call(this, { key: 'WorldScene' });
    },

    preload: function ()
    {
        //beam
        this.load.spritesheet("beam", "assets/beam.png",{
            frameWidth: 16,
            frameHeight: 16
        });

        this.enemyDied = false;
    },

    create: function ()
    {
        // create the map
        var map = this.make.tilemap({ key: 'map' });
        
        // first parameter is the name of the tilemap in tiled
        var tiles = map.addTilesetImage('spritesheet', 'tiles');
        
        // creating the layers
        var grass = map.createStaticLayer('Grass', tiles, 0, 0);
        var obstacles = map.createStaticLayer('Obstacles', tiles, 0, 0);
        
        // make all tiles in obstacles collidable
        obstacles.setCollisionByExclusion([-1]);
        
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('player', { frames: [1, 7, 1, 13]}),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('player', { frames: [1, 7, 1, 13] }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'up',
            frames: this.anims.generateFrameNumbers('player', { frames: [2, 8, 2, 14]}),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'down',
            frames: this.anims.generateFrameNumbers('player', { frames: [ 0, 6, 0, 12 ] }),
            frameRate: 10,
            repeat: -1
        });

        this.player = this.physics.add.sprite(50, 100, 'player', 6);
        
        this.physics.world.bounds.width = map.widthInPixels;
        this.physics.world.bounds.height = map.heightInPixels;
        this.player.setCollideWorldBounds(true);
        
        // don't walk on trees
        this.physics.add.collider(this.player, obstacles);

        // limit camera to map
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(this.player);
        this.cameras.main.roundPixels = true; // avoid tile bleed
    
        // user input
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // where the enemies will be
        this.spawns = this.physics.add.group();
        for(var i = 0; i < 12; i++) {
            var x = Phaser.Math.RND.between(0, this.physics.world.bounds.width);
            var y = Phaser.Math.RND.between(0, this.physics.world.bounds.height);

            var dragon = this.physics.add.sprite(16, 16, "dragonblue");
            dragon.setRandomPosition(x, y, 20, 20);
            
            dragon.body.immovable = true;
            dragon.body.moves = false;

            dragon.displayWidth=17;

            // parameters are x, y, width, height   
            this.spawns.add(dragon);
        }        

        this.physics.add.collider(this.player, this.spawns);

        //creates the beam
        this.anims.create({
            key: "beam_anim",
            frames: this.anims.generateFrameNumbers("beam"),
            frameRate: 20,
            repeat: -1
        });

        this.projectiles = this.add.group();

        this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.physics.add.overlap(this.projectiles, this.spawns, this.hitEnemy, null, this);

        this.scoreLabel = this.add.text(10, 5, "Score: 0",  { font: "bold 24px", color: "black" });
    },
    update: function ()
    {
        if (this.enemyDied) {
            this.addScore()
            this.enemyDied = false;
        }

        this.scoreLabel.x = this.player.body.x - 15; 
        this.scoreLabel.y = this.player.body.y - 20; 

        this.player.body.setVelocity(0);
        
        // Horizontal movement
        if (this.cursors.left.isDown)
        {
            this.player.body.setVelocityX(-80);
            this.playersDirection = "left"
        }
        else if (this.cursors.right.isDown)
        {
            this.player.body.setVelocityX(80);
            this.playersDirection = "right"
        }
        // Vertical movement
        if (this.cursors.up.isDown)
        {
            this.player.body.setVelocityY(-80);
            this.playersDirection = "up"
        }
        else if (this.cursors.down.isDown)
        {
            this.player.body.setVelocityY(80);
            this.playersDirection = "down"
        }        

        // Update the animation last and give left/right animations precedence over up/down animations
        if (this.cursors.left.isDown)
        {
            this.player.anims.play('left', true);
            this.player.flipX = true;
        }
        else if (this.cursors.right.isDown)
        {
            this.player.anims.play('right', true);
            this.player.flipX = false;
        }
        else if (this.cursors.up.isDown)
        {
            this.player.anims.play('up', true);
        }
        else if (this.cursors.down.isDown)
        {
            this.player.anims.play('down', true);
        }
        else
        {
            this.player.anims.stop();
        }

        if (Phaser.Input.Keyboard.JustDown(this.spacebar)){
            if(this.player.active) {
                this.shootBeam(this.playersDirection);
            }
        }

        for (var i = 0; i < this.projectiles.getChildren().length; i++) {
            var beam = this.projectiles.getChildren()[i];

            if (beam.timer == null) {
                beam.timer = 1
            } else {
                beam.timer += 1;
            }

            if (beam.timer > 30 ) {
                beam.update();
            }
        }
    },
    hitEnemy(projectile, spawn) {
        projectile.destroy();
        spawn.destroy();
        this.resetEnemyPos(spawn);
        this.enemyDied = true;
    },
    addScore() {
        if (this.score == null) {
            this.score = 15
        } else {
            this.score += 15
        }
        this.scoreLabel.setText("Score: " + this.score);
    },
    shootBeam(position) {
        var beam = new Beam(this, position);
    },
    resetEnemyPos(spawn) {
        var x = Phaser.Math.RND.between(0, this.physics.world.bounds.width);
        var y = Phaser.Math.RND.between(0, this.physics.world.bounds.height);

        var dragon = this.physics.add.sprite(16, 16, "dragonblue");
        dragon.setRandomPosition(x, y, 20, 20);
        
        dragon.body.immovable = true;
        dragon.body.moves = false;

        dragon.displayWidth=17;

        // parameters are x, y, width, height   
        this.spawns.add(dragon);
    }
});

