const express = require("express")
const path = require("path");
const {MongoClient, ObjectId} = require('mongodb');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 8000;
  
// Setting path for public directory 
//const static_path = path.join(__dirname, "public");
const static_path = __dirname;
app.use(express.static(static_path));
app.use(express.urlencoded({ extended: true }));
  
const uri = "mongodb+srv://gcsmeric:gcsmeric-todolist-mongodb-pw@todo-list.qpjjw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
const client = new MongoClient(uri);

//getting user-specific ID (ip)
var client_ID = require("ip").address();

//creating new to-do item
async function createItem(client, newItem) {
   await client.connect();
   const result = await client.db("todo-list").collection("todo-list-items").insertOne(newItem);
   client.close();

   console.log(`New to-do item created with ID ${result.insertedId} and content ${result}`);
}

//find all of client's to-do items and send them to client
async function findAllItems(client) {
   await client.connect();
   const results = await client.db("todo-list").collection("todo-list-items").find({clientID : client_ID});
   const resultsArray = await results.toArray();
   var returnArray = [];
   for (var i=0; i<resultsArray.length; i++) {
       var itemStr = resultsArray[i].day+"LOADITEM_DELIM"+resultsArray[i].content+"LOADITEM_DELIM"+resultsArray[i].item_ID;
       returnArray.push(itemStr);
       console.log(itemStr);
   }
   await client.close();
   return returnArray;
}

//delete to-do item in database by day and ID
async function deleteByID(client, ID, day) {
   await client.connect();
   const result = await client.db("todo-list").collection("todo-list-items").deleteOne({item_ID: ID, day: day, clientID: client_ID});
   await client.close();
   console.log(`${result.deletedCount} documents were deleted.`);
}

//update a to-do item in databse by updating day and ID
async function updateOne(client, oldDay, newDay, oldID, newID) {
    await client.connect();
    const result = await client.db("todo-list").collection("todo-list-items").updateOne({item_ID: oldID, day: oldDay}, {$set: {item_ID: newID, day: newDay}});
    console.log(oldDay + '-' + oldID + " to " + newDay + '-' + newID);
    await client.close();
}


// Handling request 
app.post("/request", async (req, res) => {

    //get type of request (which CRUD operation is requested)
   var type = req.body.type;
   console.log(type);
   //create new item
   if (type == 0) {
      try {
         var day_received = req.body.day;
         var content_received = req.body.content;
         var id_received = req.body.id;
         
         await createItem(client, {
             day: day_received,
             content: content_received,
             clientID: client_ID,
             item_ID: id_received
         })
     }
     catch (e) {
         console.error(e);
     }
   }
   //delete item by ID and day
   else if (type == 1) {
      try {
         var day_received = req.body.day;
         var id_received = req.body.id;
         
         await deleteByID(client, id_received, day_received);
     }
     catch (e) {
         console.error(e);
     }
   }
   //fetch and load all items from db 
   else if (type == 2) {
      try {
         var itemArray = await findAllItems(client);
         res.send(itemArray);
         res.end();
     }
     catch (e) {
         console.error(e);
     }
   }
   //update specific item
   else if (type == 3) {
       try {
           var oldDay = req.body.oldDay;
           var newDay = req.body.newDay;
           var oldID = req.body.oldID;
           var newID = req.body.newID;
           await updateOne(client, oldDay, newDay, oldID, newID);
       }
       catch (e) {
           console.error(e);
       }
   }
})
  
// Server Setup on specified port
app.listen(port, () => {
   console.log(`server is running at ${port}`);
});

