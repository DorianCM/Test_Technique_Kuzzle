<script setup>
  import { Kuzzle, WebSocket } from 'kuzzle-sdk';
  import { ref } from 'vue'

  const kuzzle = new Kuzzle(
    new WebSocket('localhost')
  );
  let messageText = ref("");
  const listMessage = ref(new Array());
  const addMessageFromKuzzleResult = (response) => {
    console.log(response);
    
  }
  try {
    await kuzzle.connect();
    kuzzle.realtime.subscribe('index-test-technique', 'chat-messages', {}, notification => {
      try {
        listMessage.value.push({
          author: notification.result._source["author"],
          message: notification.result._source["message"]
        });
      } catch (error) {
        console.error(error);
      }
    });
  } catch (error) {
    console.log(error);
  }

  const sendMessage = async () => {
    if(messageText.value != "") {
      try {
        await kuzzle.query({
          controller: "chat",
          action: "message",
          author: "Dorian",
          message: messageText.value
        })
        messageText.value = ""
      } catch (error) {
        console.error(error);
      }
    }
  }

  const getMessages = async () => {
    try {
      const response = await kuzzle.query({
        controller: "chat",
        action: "getMessages"
      });

      for(let i=0; i < response.result.hits.length; i++) {
        listMessage.value.push({
          author: response.result.hits[i]._source["author"],
          message: response.result.hits[i]._source["message"]
        });
      }
    } catch (error) {
        console.error(error);
    }
  }
  // Init chat
  getMessages();
</script>

<template>
  <h1>Chat du test technique</h1>
  <ul id="list-message">
    <li v-for="item in listMessage" :key="item.message">
      {{ item.author +" a écrit : "+item.message }}
    </li>
  </ul>
  <textarea v-model="messageText" placeholder="Type a message..."></textarea>
  <button v-on:click="sendMessage">Envoyer</button>
</template>
