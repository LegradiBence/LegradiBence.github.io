kaboom({
	background: [74, 48, 82],
})

const objs = [
	'Enemy_1',
	'Enemy_2',
	'Enemy_3',
	'Enemy_4',
	'Enemy_5',
	'Enemy_6',
]

for (const obj of objs) {
	loadSprite(obj, `jatek/kepek/${obj}.jpg`)
}

loadSprite("lovesz", `jatek/kepek/lovesz.jpg`)
loadSprite("lovedek", `jatek/kepek/bullet.png`)
loadSprite("boom", `jatek/kepek/BOOM.png`)
loadSound("hit", "/examples/sounds/hit.mp3")
loadSound("shoot", "/examples/sounds/shoot.mp3")
loadSound("explode", "/examples/sounds/explode.mp3")
loadSound("OtherworldlyFoe", "/examples/sounds/OtherworldlyFoe.mp3")

const leftBtn = document.getElementById("left")
const rightBtn = document.getElementById("right")
const shootBtn = document.getElementById("shoot")

scene("battle", () => {

	const BULLET_SPEED = 1200
	const TRASH_SPEED = 120
	const BOSS_SPEED = 48
	const PLAYER_SPEED = 480
	const BOSS_HEALTH = 100
	const OBJ_HEALTH = 4

	const bossName = choose(objs)
	let insaneMode = false
	const music = play("OtherworldlyFoe")
	volume(0.5)

	// --- Player hozzáadása ---
	const player = add([
		sprite("lovesz"),
		area(),
		pos(width() / 2, height() - 64),
		anchor("center"),
	])

	// --- Bullet spawn ---
	function spawnBullet(p) {
		add([
			sprite("lovedek"),
			area(),
			pos(p),
			anchor("center"),
			color(127, 127, 255),
			outline(4),
			move(UP, BULLET_SPEED),
			offscreen({ destroy: true }),
			"bullet",
		])
	}

	// --- Trash spawn ---
	function spawnTrash() {
		const name = choose(objs.filter(n => n != bossName))
		add([
			sprite(name),
			area(),
			pos(rand(0, width()), 0),
			health(OBJ_HEALTH),
			anchor("bot"),
			"trash",
			"enemy",
			{ speed: rand(TRASH_SPEED * 0.7, TRASH_SPEED * 2) },
		])
		wait(insaneMode ? 0.3 : 0.5, spawnTrash)
	}

	// --- Controls (keyboard + mobile) ---
	let movingLeft = false
	let movingRight = false

	onKeyDown("left", () => movingLeft = true)
	onKeyDown("right", () => movingRight = true)
	onKeyRelease("left", () => movingLeft = false)
	onKeyRelease("right", () => movingRight = false)

	onKeyPress("space", () => {
		spawnBullet(player.pos.sub(16, 0))
		spawnBullet(player.pos.add(16, 0))
		play("shoot", { volume: 0.3, detune: rand(-1200, 1200) })
	})

	onKeyPress("up", () => { insaneMode = true; music.speed = 2 })
	onKeyRelease("up", () => { insaneMode = false; music.speed = 1 })

	// --- Mobile buttons ---
	leftBtn.ontouchstart = () => movingLeft = true
	leftBtn.ontouchend = () => movingLeft = false

	rightBtn.ontouchstart = () => movingRight = true
	rightBtn.ontouchend = () => movingRight = false

	shootBtn.ontouchstart = () => {
		spawnBullet(player.pos.sub(16,0))
		spawnBullet(player.pos.add(16,0))
		play("shoot", {volume:0.3, detune:rand(-1200,1200)})
	}
	onUpdate(() => {
		if(movingLeft){
			player.move(-PLAYER_SPEED,0)
			if(player.pos.x<0) player.pos.x = width()
		}
		if(movingRight){
			player.move(PLAYER_SPEED,0)
			if(player.pos.x>width()) player.pos.x = 0
		}
	})

	// --- Boss ---
	const boss = add([
		sprite(bossName),
		area(),
		pos(width() / 2, 40),
		health(BOSS_HEALTH),
		scale(3),
		anchor("top"),
		"enemy",
		{ dir: 1 },
	])

	boss.onUpdate(() => {
		boss.move(BOSS_SPEED * boss.dir * (insaneMode ? 3 : 1), 0)
		if (boss.dir === 1 && boss.pos.x >= width() - 20) boss.dir = -1
		if (boss.dir === -1 && boss.pos.x <= 20) boss.dir = 1
	})

	const healthbar = add([
		rect(width(), 24),
		pos(0, 0),
		color(107, 201, 108),
		fixed(),
		{
			max: BOSS_HEALTH,
			set(hp) { this.width = width() * hp / this.max; this.flash = true },
		},
	])

	boss.onHurt(() => healthbar.set(boss.hp()))
	boss.onDeath(() => { music.stop(); go("win", { boss: bossName }) })

	// --- Collisions ---
	onCollide("bullet", "enemy", (b, e) => {
		destroy(b)
		e.hurt(insaneMode ? 10 : 1)
	})

	onCollide("player", "enemy", (p, e) => {
		destroy(p)
		destroy(e)
		music.paused = true
		go("battle")
	})

	spawnTrash()
})

scene("win", ({ boss }) => {
	add([text(`YOU DEFEATED ${boss}!`, 32), pos(width() / 2, height() / 2), anchor("center")])
	wait(3, () => go("battle"))
})

go("battle")
