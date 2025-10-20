import { firebaseConfig } from "./firebaseConfig.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

kaboom({
	canvas: document.getElementById("gameCanvas"),
	width: window.innerWidth,
	height: window.innerHeight - 70,
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
loadFont("myfont", `jatek/font/font.ttf`)

const leftBtn = document.getElementById("left")
const rightBtn = document.getElementById("right")
const shootBtn = document.getElementById("shoot")
const BULLET_SPEED = 1200
const TRASH_SPEED = 120
const BOSS_SPEED = 48
const PLAYER_SPEED = 480
const BOSS_HEALTH = 100
const OBJ_HEALTH = 4

async function showSaveScore(time, points) {
	const overlay = document.getElementById("overlay");
	const wrapper = document.getElementById("nameInputWrapper");
	const input = document.getElementById("nameInput");
	const btn = document.getElementById("saveScoreBtn");

	overlay.style.display = "block";
	wrapper.style.display = "block";
	input.value = "";
	input.focus();

	return new Promise(resolve => {
		btn.onclick = async () => {
			const name = input.value || "Játékos";
			wrapper.style.display = "none";
			overlay.style.display = "none";
			await saveScore(name, time, points);
			resolve();
		}
	});
}
async function saveScore(name, time, points) {
	try {
		const scoresCol = collection(db, "scores");
		await addDoc(scoresCol, { name, time, points, date: new Date() });
	} catch (err) {
		console.error("Hiba a score mentésekor:", err);
	}
}

async function getTopScores() {
	try {
		const scoresCol = collection(db, "scores");
		const q = query(scoresCol, orderBy("points", "desc"), limit(10));
		const snapshot = await getDocs(q);
		return snapshot.docs.map(doc => doc.data());
	} catch (err) {
		console.error("Hiba a score lekérésekor:", err);
	}
}
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
		// strings here means a tag
		"bullet",
	])
}

let player = null;
let movingLeft = false;
let movingRight = false;

leftBtn.addEventListener("mousedown", () => movingLeft = true);
leftBtn.addEventListener("touchstart", () => movingLeft = true);

rightBtn.addEventListener("mousedown", () => movingRight = true);
rightBtn.addEventListener("touchstart", () => movingRight = true);

document.addEventListener("mouseup", () => {
	movingLeft = false;
	movingRight = false;
});
document.addEventListener("touchend", () => {
	movingLeft = false;
	movingRight = false;
});

shootBtn.addEventListener("click", () => {
	spawnBullet(player.pos.sub(16, 0));
	spawnBullet(player.pos.add(16, 0));
});


scene("menu", () => {
	add([
		text("Kolbásztöltés", { size: 48 }),
		pos(width() / 2, height() / 3),
		anchor("center"),
	])

	const startText = "▶️ Indítás";
	const startSize = 32;

	// 1. Definiáljuk a gombot (pl. egy rect-ként, aminek van area-ja)
	add([
		rect(300, 50), // 👈 Állíts be egy fix, látható területet a kattintáshoz (pl. 300x50 pixel)
		pos(width() / 2, height() / 2),
		anchor("center"),
		color(0, 0, 0, 0), // 👈 Teljesen átlátszóvá tesszük a hátteret
		area(),           // 👈 A téglalaphoz rendeljük a hitboxot
		z(10),
		"startBtn"
	]);

	// 2. Hozzáadjuk a szöveget, ami a gomb fölött van
	add([
		text(startText, { size: startSize }),
		pos(width() / 2, height() / 2),
		anchor("center"),
		color(255, 255, 255),
		z(11), // Egyel magasabb z-index, hogy a téglalap fölött legyen
	]);

	// 🏆 SCOREBOARD GOMB
	const scoreTextStr = "🏆 Eredménytábla";
	const scoreSize = 24;

	add([
		rect(300, 40), // Fix terület a scoreboard gombnak
		pos(width() / 2, height() / 2 + 80),
		anchor("center"),
		color(0, 0, 0, 0), // Átlátszó háttér
		area(),
		z(10),
		"scoreBtn"
	]);

	add([
		text(scoreTextStr, { size: scoreSize }),
		pos(width() / 2, height() / 2 + 80),
		anchor("center"),
		color(255, 255, 255),
		z(11),
	]);

	onClick("startBtn", () => {
		go("battle")
	})

	onClick("scoreBtn", () => {
		go("scoreboard")
	})

})

scene("scoreboard", async () => {
	add([
		text("🏆 Top Darálók", { size: 44 }),
		pos(width() / 2, height() / 7),
		anchor("center"),
	]);

	const scores = await getTopScores();

	scores.forEach((s, i) => {
		add([
			text(`${i + 1}. ${s.name.substring(0, 12)} — ${Number(s.time).toFixed(2)}s — ${s.points} pont`, { size: 15 }),
			pos(width() / 2 , height() / 2 - 150 + i * 30),
			anchor("center"),
		]);
	});

	const backTextStr = "🔙 Vissza";
	const backSize = 24;

	add([
		rect(300, 40), // Fix terület a scoreboard gombnak
		pos(width() / 2, height() * 4 / 5),
		anchor("center"),
		color(0, 0, 0, 0), // Átlátszó háttér
		area(),
		z(10),
		"backBtn"
	]);

	add([
		text(backTextStr, { size: backSize }),
		pos(width() / 2, height() * 4 / 5),
		anchor("center"),
		color(255, 255, 255),
		z(11),
	]);

	onClick("backBtn", () => go("menu"));
});

scene("battle", () => {


	const bossName = choose(objs)

	let insaneMode = false
	// Mobil / desktop detektálás
	const isMobile = /Mobi|Android/i.test(navigator.userAgent);

	let points = 0;
	let gameEnd = false;

	player = add([
		sprite("lovesz"),
		area(),
		pos(width() / 2, height() - 64),
		anchor("center"),
	])

	player.pos.y = height() * 425 / 500;



	const music = play("OtherworldlyFoe", { loop: true })

	volume(0.5)

	function grow(rate) {
		return {
			update() {
				const n = rate * dt()
				this.scale.x += n
				this.scale.y += n
			},
		}
	}

	function late(t) {
		let timer = 0
		return {
			add() {
				this.hidden = true
			},
			update() {
				timer += dt()
				if (timer >= t) {
					this.hidden = false
				}
			},
		}
	}

	add([
		text("ÖLD", { size: 140, font: "myfont" }),
		pos(width() / 2, height() / 2),
		anchor("center"),
		lifespan(1),
		fixed(),
	])

	add([
		text("A", { size: 100, font: "myfont" }),
		pos(width() / 2, height() / 2),
		anchor("center"),
		lifespan(2),
		late(1),
		fixed(),
	])

	add([
		text("DISZNÓKAT", { size: 110, font: "myfont" }),
		pos(width() / 2, height() / 2),
		anchor("center"),
		lifespan(4),
		late(2),
		fixed(),
	])

	const scoreText = add([
		text("Pont: 0", { size: 24 }),
		pos(12, 64),
		fixed(),
		z(10),
	]);

	onUpdate(() => {
		scoreText.text = `Pont: ${points}`;
	});

	const sky = add([
		rect(width(), height()),
		color(0, 0, 0),
		opacity(0),
	])

	sky.onUpdate(() => {
		if (insaneMode) {
			const t = time() * 10
			sky.color.r = wave(127, 255, t)
			sky.color.g = wave(127, 255, t + 1)
			sky.color.b = wave(127, 255, t + 2)
			sky.opacity = 1
		} else {
			sky.color = rgb(0, 0, 0)
			sky.opacity = 0
		}
	})


	onKeyDown("left", () => {
		player.move(-PLAYER_SPEED, 0)
		if (player.pos.x < 0) {
			player.pos.x = width()
		}
	})

	onKeyDown("right", () => {
		player.move(PLAYER_SPEED, 0)
		if (player.pos.x > width()) {
			player.pos.x = 0
		}
	})

	onKeyPress("up", () => {
		insaneMode = true
		music.speed = 2
	})

	onKeyRelease("up", () => {
		insaneMode = false
		music.speed = 1
	})

	player.onCollide("enemy", (e) => {
		if (gameEnd) return;
		gameEnd = true;
		destroy(e)
		destroy(player)
		shake(120)
		play("explode")
		music.detune = -1200
		addExplode(center(), 12, 120, 30)
		wait(1, () => {
			music.paused = true
			go("menu")
		})
	})

	function addExplode(p, n, rad, size) {
		for (let i = 0; i < n; i++) {
			wait(rand(n * 0.1), () => {
				for (let i = 0; i < 2; i++) {
					add([
						pos(p.add(rand(vec2(-rad), vec2(rad)))),
						rect(4, 4),
						scale(1 * size, 1 * size),
						lifespan(0.1),
						grow(rand(48, 72) * size),
						anchor("center"),
					])
				}
			})
		}
	}



	onUpdate("bullet", (b) => {
		if (insaneMode) {
			b.color = rand(rgb(0, 0, 0), rgb(255, 255, 255))
		}
	})

	onKeyPress("space", () => {
		spawnBullet(player.pos.sub(16, 0))
		spawnBullet(player.pos.add(16, 0))
		play("shoot", {
			volume: 0.3,
			detune: rand(-1200, 1200),
		})
	})

	function spawnTrash() {
		if (gameEnd) return;
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
		wait(insaneMode ? 0.3 : 0.5, () => {
			if (!gameEnd) spawnTrash()
		})
	}

	const boss = add([
		sprite(bossName),
		area(),
		pos(width() / 2, 40),
		health(BOSS_HEALTH),
		scale(3),
		anchor("top"),
		"enemy",
		{
			dir: 1,
		},
	])

	on("death", "enemy", (e) => {
		points += 1;
		destroy(e)
		shake(2)
		add([
			sprite("boom"),
			pos(e.pos),
			scale(2),
			anchor("center"),
			lifespan(0.5),
		])
	})

	on("hurt", "enemy", (e) => {
		shake(1)
		play("hit", {
			detune: rand(-1200, 1200),
			speed: rand(0.2, 2),
		})
	})

	const timer = add([
		text(0),
		pos(12, 32),
		fixed(),
		{ time: 0 },
		z(10),
	])

	timer.onUpdate(() => {
		if (gameEnd) return;
		timer.time += dt()
		timer.text = timer.time.toFixed(2)
	})

	onCollide("bullet", "enemy", (b, e) => {
		destroy(b)
		e.hurt(insaneMode ? 10 : 1)
		addExplode(b.pos, 1, 24, 1)
	})

	onUpdate("trash", (t) => {
		t.move(0, t.speed * (insaneMode ? 5 : 1))
		if (t.pos.y - t.height > height()) {
			destroy(t)
		}
	})

	boss.onUpdate((p) => {
		boss.move(BOSS_SPEED * boss.dir * (insaneMode ? 3 : 1), 0)
		if (boss.dir === 1 && boss.pos.x >= width() - 20) {
			boss.dir = -1
		}
		if (boss.dir === -1 && boss.pos.x <= 20) {
			boss.dir = 1
		}
	})

	boss.onHurt(() => {
		healthbar.set(boss.hp())
	})

	boss.onDeath(() => {
		if (gameEnd) return;
		music.stop();
		gameEnd = true;
		get("trash").forEach(t => destroy(t));
		get("bullet").forEach(b => destroy(b));
		player.hidden = true;


		go("win", { time: timer.time, boss: bossName, points: points });
	});

	const healthbar = add([
		rect(width(), 24),
		pos(0, 0),
		color(107, 201, 108),
		fixed(),
		{
			max: BOSS_HEALTH,
			set(hp) {
				this.width = width() * hp / this.max
				this.flash = true
			},
		},
	])

	healthbar.onUpdate(() => {
		if (healthbar.flash) {
			healthbar.color = rgb(255, 255, 255)
			healthbar.flash = false
		} else {
			healthbar.color = rgb(127, 255, 127)
		}
	})

	if (!isMobile) {
		add([
			text("UP: insane mode", { width: width() / 2, size: 32 }),
			anchor("botleft"),
			pos(24, height() - 24),
		]);
	}

	spawnTrash()

	// Folyamatos mozgatás
	onUpdate(() => {
		let vx = 0;
		if (movingLeft || isKeyDown("left")) vx -= PLAYER_SPEED;
		if (movingRight || isKeyDown("right")) vx += PLAYER_SPEED;
		player.move(vx, 0);

		// wrap around
		if (player.pos.x < 0) player.pos.x = width();
		if (player.pos.x > width()) player.pos.x = 0;
	})

})

scene("win", async ({ time, boss, points }) => {

	const b = burp()
	const detuneLoop = loop(0.5, () => {
		b.detune = rand(-1200, 1200)
	})

	add([
		sprite(boss),
		color(255, 0, 0),
		anchor("center"),
		scale(8),
		pos(width() / 2, height() / 2),
	])

	add([
		text(time.toFixed(2), 24),
		anchor("center"),
		pos(width() / 2, height() / 2),
	])

	// Pont mentése
	await showSaveScore(time, points);
	wait(2, () => {
		detuneLoop.cancel()
		b.stop()
		go("menu")
	})
})

go("menu")
