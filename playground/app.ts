import { Backend, KuzzleRequest } from 'kuzzle'
import { stringify } from 'querystring';
//const app = new MyApplication();

const app = new Backend("test-technique");

app.controller.register('chat', {
  actions: {
    message: {
      handler: async request => {
        return app.sdk.document.create('index-test-technique', 'chat-messages', {
          author: request.getString('author'),
          message: request.getString('message')
        })
      }
    },
    getMessages: {
      handler: async request => {
        return app.sdk.document.search('index-test-technique', 'chat-messages',
          {
            size:100,
            sort:{ "_kuzzle_info.createdAt": "asc" }
          }
        )
        
      }
    }
  }
})

app.pipe.register('chat:beforeMessage', async (request: KuzzleRequest) => {
  try {
    const valid = await app.sdk.document.validate(
      'index-test-technique',
      'chat-messages',
      request.input.args
    );
    if (valid) {
      console.log('Success');
    }
  } catch (error) {
    console.error(error.message);
  }
  // BONUS
  if(String(request.input.args.message).includes("Gros mot")) {
    request.input.args.message = "Pas de gros mots "+request.input.args.author
    request.input.args.author = "Admin"
  }
  
  return request;
});

app.start()
  .then(async () => {
    app.log.info("Application started");

    if (! await app.sdk.index.exists('index-test-technique')) {
      await app.sdk.index.create('index-test-technique');
      
      await app.sdk.collection.create('index-test-technique','chat-messages', {
        mappings: {
          properties: {
            author: { type: 'text' },
            message: { type: 'text' }
          }
        }
      });
      const res = await app.sdk.collection.updateSpecifications('index-test-technique','chat-messages',
      {
        strict: false,
        fields: {
          message: {
            type: "string",
            typeOptions:  {
              length: {
                max : 255
              }
            }
          }
        }
      })
    }
    await app.sdk.realtime.subscribe('index-test-technique', 'chat-messages', {}, notification => {
      console.log(notification);
    });
  })
  .catch(console.error);
