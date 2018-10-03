var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var json_words = require('./nouns.json');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');

});
var padding = 4;
var board = [
  ["Stone", "Box", "Amsterdam", "Stock", "Hospital"],
  ["Switch", "Button", "Horse", "Dog", "Turkey"],
  ["England", "Berlin", "Block", "Board", "Ring"],
  ["Day", "Hit", "Stop", "Ball", "Wheelchair"],
  ["Radius", "Pixel", "Genius", "Leather", "Tint"],
]
var key = [
  ["null", "null", "null", "null", "null"],
  ["null", "null", "null", "null", "null"],
  ["null", "null", "null", "null", "null"],
  ["null", "null", "null", "null", "null"],
  ["null", "null", "null", "null", "null"]
]

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function generateBoard(){
  var newBoard = board.slice();
  for (var i = 0; i < newBoard.length;i++){
    for (var j = 0; j < newBoard[0].length; j++) {
      rand = getRandomInt(json_words.data.length);
      newBoard[i][j] = json_words.data[rand];
      json_words.data.splice(rand, 1);
    }
  }
  return newBoard;
}

function generateKey(){
  var newKey = key.slice();
  // [red agents, blue agents, neutrals, assassin]
  var distribution = [9, 8, 7, 1];
  var symbols = [":red_circle:", ":large_blue_circle:", ":white_circle:", ":black_circle:"];
  //determine starting team, if this returns true, blue is the starting team
  if(getRandomInt(2)){
    distribution[0] = 8;
    distribution[1] = 9;
  }

  for (var i = 0; i < newKey.length;i++){
    for (var j = 0; j < newKey[0].length; j++) {

      rand = getRandomInt(4);
      //get new team ID if the team's agents have all been distributed
      while(distribution[rand]==0){
        rand = getRandomInt(4);
      }

      newKey[i][j] = symbols[rand];
      distribution[rand] -= 1
    }
  }
  return newKey
}

function drawKey(key, channelID) {
  var string = "";
  for (var i = 0; i < key.length;i++){
    for (var j = 0; j < key[0].length; j++) {
      string += key[i][j];
      string += " ";
    }
    string += "\n";
  }
  bot.sendMessage({
      to: channelID,
      message: string});
}

// Sends a message with the current board
function drawBoard(word_array, channelID){
  var string = "";
  var longest = 0;
  string += "```"
  for (var i = 0; i < word_array.length;i++){
    for (var j = 0; j < word_array[i].length; j++) {
      if (word_array[i][j].length > longest){
        longest = word_array[i][j].length;
      }
    }
  }
  for (var i = 0; i < word_array.length;i++){
    for (var j = 0; j < word_array[0].length; j++) {

      string += word_array[i][j].toUpperCase();

      for(var p = (longest - word_array[i][j].length) + padding; p > 0; p--){
        string += " "
      }
    }
    string += "\n";
  }
  string += "```";
  bot.sendMessage({
      to: channelID,
      message: string});
}

function guessWord(word, team, channelID){
  var guess = word.toUpperCase();
  var found = false;
  console.log(guess);
  for (var i = 0; i < board.length;i++){
    for (var j = 0; j < board[i].length; j++) {
      if (board[i][j].toUpperCase() == guess){
        switch (key[i][j]) {
          case ":red_circle:":
            board[i][j] = "~~RED AGENT~~";
            break;
          case ":large_blue_circle:":
            board[i][j] = "BLUE AGENT";
            break;
          case ":white_circle:":
            board[i][j] = "~~CIVILIAN~~";
            break;
          case ":black_circle:":
            board[i][j] = "~~ASSASSIN~~";
            break;
        }
        found = true;

      }

    }
  }
  if (found == false) {
    bot.sendMessage({
        to: channelID,
        message: 'Invalid guess, did you misspell that? :thinking: Try again!'
    });
  }
  else {
    drawBoard(board, channelID);
  }
}

bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];

        args = args.splice(1);
        switch(cmd) {
            // !ping
            case 'ping':
                bot.sendMessage({
                    to: channelID,
                    message: 'Pong! :thinking:'

                });
            break;
            // Just add any case commands if you want to..

            case 'startgame':
              board = generateBoard();
              key = generateKey();
              drawBoard(board, channelID);
            break;

            case ('drawkey' || 'dk'):
              drawKey(key, channelID);
            break;

            case 'draw':
              drawBoard(board, channelID);
            break;
         }
         if (cmd.includes("red")){
           console.log(args);
           guessWord(args[0], "red", channelID)

         }
         else if(cmd.includes("blue")){
           console.log(args);
           guessWord(args[0], "blue", channelID)
         }
     }
});
