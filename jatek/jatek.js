
kaboom({
    background: [0, 0, 0],
    width: 480,
    height: 320,
    touchToMouse: true,
});

// Sprites
loadSprite("jatekos", "./kepek/proba.png");
loadSprite("ellenseg", "./kepek/Enemy_1.png");

// Állapotjelző, hogy épp ütés van-e
let utesAktiv = false;

// Fő jelenet
scene("main", () => {

    // Talaj
    add([
        rect(width(), 48),
        pos(0, height() - 48),
        area(),
        body({ isStatic: true }),
        color(100, 100, 255),
    ]);

    // Játékos
    const jatekos = add([
        sprite("jatekos"),
        pos(100, height() - 48 - 64),
        area(),
        body(),
        "jatekos"
    ]);

    // Mozgás
    onUpdate(() => {
        jatekos.move(100, 0);
    });

    // Ütés koppintásra
    onClick(() => {
        if (!utesAktiv) {
            utesAktiv = true;
            debug.log("Ütés!");

            // Pl. ugrik egyet ütés helyett
            if (jatekos.isGrounded()) {
                jatekos.jump(300);
            }

            // Ütés állapot visszaállítása 0.3 másodperc után
            wait(0.3, () => {
                utesAktiv = false;
            });
        }
    });

    // Ellenség hozzáadása
    const ellenseg = add([
        sprite("ellenseg"),
        pos(400, height() - 48 - 64),
        area(),
        body({ isStatic: true }), // nem mozog
        "ellenseg",
    ]);

    // Ütközés: ha játékos eléri az ellenséget
    jatekos.onCollide("ellenseg", (e) => {
        if (utesAktiv) {
            destroy(e); // ellenség meghal
            debug.log("Ellenség legyőzve!");
        } else {
            debug.log("Meghaltál!");
            shake(); // rázás effekt
            go("vesztettel");
        }
    });
});

// Vesztes jelenet
scene("vesztettel", () => {
    add([
        text("Game Over", { size: 32 }),
        pos(center()),
        anchor("center"),
    ]);

    onClick(() => go("main")); // újrakezdés érintésre
});

go("main");
