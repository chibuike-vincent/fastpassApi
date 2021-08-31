const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const result = ""
const charactersLength = characters.length;

for ( let i = 0; i < 5 ; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
}

return result