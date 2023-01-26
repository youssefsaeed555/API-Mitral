const fetch = require('node-fetch')

const API_KEY = process.env.API_KEY_DAILYCO

const headers = {
  Accept: "application/json",
  "Content-Type": "application/json",
  Authorization: "Bearer " + API_KEY,
};
exports.getRoom = async(room) => {
  
  return await fetch(`https://api.daily.co/v1/rooms/${room}`, {
    method: "GET",
    headers,
  })
    .then((res) => res.json())
    .then((json) => {
      return json;
    })
    .catch((err) => console.error("error:" + err));
};

exports.createRoom = async(room,start) => {
  return await fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: room,
      privacy:"public",
      properties: {
        nbf:start,
        max_participants:3,
        enable_screenshare: true,
        enable_chat: true,
        start_video_off: true,
        start_audio_off: true,
        lang: "en",
      },
    }),
  })
    .then((res) => res.json())
    .then((json) => {
      return json;
    })
    .catch((err) => console.log("error:" + err));
}
exports.deleteRoom = async(room) => {
  
  return await fetch(`https://api.daily.co/v1/rooms/:${room}`, {
    method: "DELETE",
    headers,
  })
    .then((res) => res.json())
    .then((json) => {
      return json;
    })
    .catch((err) => console.error("error:" + err));
};
