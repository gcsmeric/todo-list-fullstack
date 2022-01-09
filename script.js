//Days of the week
const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'wkd'];
//Add event listeners to 'add' buttons
var listInputs = document.getElementsByClassName("list-input");
for (var i=0; i<listInputs.length; i++) {
    listInputs[i].addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            var day = e.target.id.slice(0, 3);
            addToList(day);
        }
    });
}

//initialize array used to store item IDs in-use for each day to avoid duplicate IDs
var used_ids_days = new Array(6);
for (var i=0; i<used_ids_days.length; i++) {
    used_ids_days[i] = [];
}

//Reloads data into the list
window.onload = function() {
    getDataFromServerAndLoad();

    //Changing background colour of current day's div on page load
    var currentDay = getDay();
    document.getElementById(currentDay).style.background = "#D6D6D6";
    document.getElementById(currentDay).getElementsByClassName("day-title")[0].textContent += "(Today)";
}

//issue request to server to fetch all items from MongoDB database and load them to client webpage
function getDataFromServerAndLoad() {
    $.post("/request",
    {
       type: 2, //0 for add, 1 for delete
    },
    ).then(res => {
        try {
            for (var i = 0; i<res.length; i++) {
                console.log(res[i]);
                var itemArray = res[i].split("LOADITEM_DELIM");
                //loading each client to-do item from db to the list
                loadToList(itemArray[0], "  " + itemArray[1], parseInt(itemArray[2]));
            }
        }
        catch (e) {
            console.log(e);
        }
    });
}

//Adds a new an element to a list when the plus button is clicked
function addToList(day) {

    //Creating a new text element to add to the list
    var newNode = document.createElement("li");
    var nodeValue = document.createTextNode(document.getElementById(day + "-input").value);
    var inputID = "#" + day + "-input";
    var nodeValueStr = $(inputID).val();
    newNode.appendChild(nodeValue);
    newNode.addEventListener('click', changeState);
    newNode.className = "list-item-text";

    console.log(nodeValue.textContent)
    //Making sure that there is something to add
    if (nodeValue.textContent === "") {
        throw "Each list item must contain text!";
    }

    //Creating a push button (push the item to the next day)
    var pushButtonContainer = document.createElement("div");
    var pushButton = document.createTextNode(">");
    pushButtonContainer.appendChild(pushButton);
    pushButtonContainer.addEventListener("click", pushToNextDay);
    pushButtonContainer.className = "push-btn";

    //Creating a close button and appending it to the item to be added
    var closeButtonContainer = document.createElement("div");
    var closeButton = document.createTextNode("×");
    closeButtonContainer.appendChild(closeButton);
    closeButtonContainer.addEventListener("click", () => {
      removeItemFromDB(day);
      removeItem(closeButtonContainer);
    });
    closeButtonContainer.className = "close-btn";

    //finding unused ID for new item
    var item_id = 0;
    while (true) {
        if (used_ids_days[days.indexOf(day)].includes(item_id)) {
            item_id+=1;
        }
        else {
            break;
        }
    }
    while (used_ids_days[days.indexOf(day)].includes(item_id)) {
        item_id++;
    }
    //updating used ID array
    used_ids_days[days.indexOf(day)].push(item_id);

    //Creating a container for a list item
    var listItemContainer = document.createElement("div");
    listItemContainer.className = "list-item-container";
    listItemContainer.id = day + '-' + String(item_id);
    listItemContainer.appendChild(newNode);
    listItemContainer.appendChild(pushButtonContainer);
    listItemContainer.appendChild(closeButtonContainer);

    //Appending the new element to the list
    document.getElementById(day + "-list").appendChild(listItemContainer);
    document.getElementById(day + '-input').value = null;

    //post request to server to add item to database
    $.post("/request",
    {
       type: 0, //0 for add, 1 for delete
       day: day,
       content: nodeValueStr,
       id: item_id
    },
    function (data, status) {
        alert('check');
       console.log(data);
    });

}

//Same as add to list, but takes an input
function loadToList(day, text, id) {
    
    //Creating a new text element to add to the list
    var newNode = document.createElement("li");
    var nodeValue = document.createTextNode(text.slice(2, text.length));
    newNode.appendChild(nodeValue);
    newNode.addEventListener('click', changeState);
    newNode.className = "list-item-text";
    if (text.slice(0,2) === "y-") {
        newNode.classList.add("text-checked");
    }

    //Creating a push button (push the item to the next day)
    var pushButtonContainer = document.createElement("div");
    var pushButton = document.createTextNode(">");
    pushButtonContainer.appendChild(pushButton);
    pushButtonContainer.addEventListener("click", pushToNextDay);
    pushButtonContainer.className = "push-btn";

    //Creating a close button and appending it to the item to be added
    var closeButtonContainer = document.createElement("div");
    var closeButton = document.createTextNode("×");
    closeButtonContainer.appendChild(closeButton);
    closeButtonContainer.addEventListener("click", () => {
      removeItem(closeButtonContainer, day);
    });
    closeButtonContainer.className = "close-btn";


    //Creating a container for a list item
    var listItemContainer = document.createElement("div");
    listItemContainer.className = "list-item-container";
    listItemContainer.id = day + '-' + String(id)/*String(day_item_counts[days.indexOf(day)]+1)*/;
    if (text.slice(0,2) === "y-") {
        listItemContainer.classList.add("div-checked");
    }
    listItemContainer.appendChild(newNode);
    listItemContainer.appendChild(pushButtonContainer);
    listItemContainer.appendChild(closeButtonContainer);

    //Appending the new element to the list
    document.getElementById(day + "-list").appendChild(listItemContainer);
    document.getElementById(day + '-input').value = null;

    //add ID to array of used IDs for that day
    used_ids_days[days.indexOf(day)].push(id);
}
//Changes the state of a list item to checked when it is clicked
function changeState() {
    this.parentElement.classList.toggle("div-checked");
    this.classList.toggle("text-checked");
}

//Removes a list item
function removeItem(element, day) {
    var grandparentID = element.parentElement.parentElement.id;
    var day = grandparentID.substring(0, 3);
    var id = element.parentElement.id;
    var numerical_id = id.substring(4, id.length);
    element.parentElement.remove();
    removeItemFromDB(day, numerical_id);

    const index = used_ids_days[days.indexOf(day)].indexOf(id);
    used_ids_days[days.indexOf(day)].splice(index, 1);
}
function removeItemFromDB(day, id) {
   //post request to server to remove item from database
   $.post("/request",
   {
      type: 1, //0 for add, 1 for delete
      day: day,
      id: id
   },
   function (data, status) {
      console.log(data);
   });
}


//Pushes the item to the next day when the blue button is clicked
function pushToNextDay() {
    //fetching item parameters
    var curDay = this.parentElement.parentElement.id.slice(0,3);
    var parcel = this.parentElement;
    var prevDay = this.parentElement.id.substring(0,3);
    var prevID = parseInt(this.parentElement.id.substring(4, this.parentElement.id.length));
    //removing moved item from day list where it was originally
    this.parentElement.remove();
    var day = "";
    //find the day which the item will be moved to
    if (curDay === "wkd") {
        day = "mon";
    } else {
        var i;
        for (i = 0; i < days.length; i++) {
            if (days[i] === curDay) {
                day = days[i+1];
                break;
            }
        }
    }

    //finding unused ID for new item
    var item_id = 0;
    console.log(used_ids_days);
    while (true) {
        if (used_ids_days[days.indexOf(day)].includes(item_id)) {
            item_id+=1;
        }
        else {
            break;
        }
    }
    while (used_ids_days[days.indexOf(day)].includes(item_id)) {
        item_id++;
    }
    //update used ID array
    used_ids_days[days.indexOf(day)].push(item_id);
    const index = used_ids_days[days.indexOf(prevDay)].indexOf(prevID);
    used_ids_days[days.indexOf(prevDay)].splice(index, 1);
    //re-add item to it's new day list
    parcel.id = day + "-" + String(item_id);
    document.getElementById(day + '-list').appendChild(parcel);

    //issue request to server to update the item's day and ID in the database
    $.post("/request",
    {
        type: 3, //3 for edit db entry
        oldDay: prevDay,
        oldID: prevID,
        newDay: day,
        newID: item_id
    },
    function (data, status) {
        console.log(data);
    });
}



//Obtaining current day 
function getDay() {
    var currentDate = new Date();
    var day = currentDate.getDay();
    var dayIndices = [5, 0, 1, 2, 3, 4, 5];
    var dayIndex = dayIndices[day];
    return days[dayIndex];
}


