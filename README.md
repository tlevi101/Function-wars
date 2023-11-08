# Function-wars
## Leírás 
Egy többjátékos játékot valósítottam meg, melynek célja, hogy egy játékos
eltaláljon valakit egy matematikai függvénnyel. A játékot 2-4 játékos játszhatja és a játék
akkor ér véget, ha egy függvény képe eltalált egy játékost. Játék közben a játékosok képesek 
egymással beszélgetni, egymásnak barát kérelmet küldeni és privátban beszélgetni egymással.

Grafikus szerkesztővel többféle pályát is létre lehet hozni. Lehetőség van
választani 2 féle akadály közül (ellipszis és téglalap). Ezek magassága és szélessége
állítható, „drag-and-drop”-val pedig mozgatható a pályán.

A felhasználók 4 féle jogosultsági kör egyikébe tartozhatnak: szuper admin,
admin, regisztrált felhasználó (továbbiakban csak felhasználó) és vendég. A felhasználók
tudnak játékhoz csatlakozni, saját játékot és pályát létrehozni, más játékosokkal
barátságban lenni, és velük privát üzeneteket váltani. A vendég felhasználók csak
játékhoz tudnak csatlakozni, és a csoportos chat funkciót használni. A szuper admin
felhasználó automatikusan jön létre, ezzel a felhasználóval lehet sima admin
felhasználókat kinevezni.

A szerver- és a kliensoldal teljes mértékben különálló. A szerver API-ként
működik és a kliens HTTP kéréseket küld a szervernek. A szerver Type- és JavaScript-
ben íródott NodeJS-t használva, a TypeScript kódok (JavaScript kódokkal együtt) egy
külön mappába fordulnak le futtatás előtt. A kéréseket a kliens felől express szerver
segítségével kezelem. MySQL adatbázist futtatok ennek kezelésére Sequelize ORM
keretrendszert használok.
