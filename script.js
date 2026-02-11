document.addEventListener("DOMContentLoaded", loadTasks);

function addTask() {
    let taskInput = document.getElementById("taskInput");
    let taskList = document.getElementById("taskList");

    if (taskInput.value.trim() === "") return;

    let taskItem = document.createElement("li");
    let taskText=document.createElement("span");
    taskText.taxtcontent=taskInput.value;
    taskText.oneclick=function() {taskText.classList.toggle(
        "completed"
    );
      toggleTaskstatus(taskInput.value);#
    taskItem.textContent = taskInput.value;}

    let removeBtn = document.createElement("button");
    removeBtn.textContent = "X";
    removeBtn.onclick = function () {
        taskList.removeChild(taskItem);
        removeTaskFromStorage(taskInput.value);
    };

    taskItem.appendChild(taskText);
    taskItem.appendChild(removeBtn);
    taskList.appendChild(taskItem);
   
    saveTaskToStorage(taskInput.value, false);
    taskInput.value = "";
}

// Save task to local storage
function saveTaskToStorage(task, completed) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.push({ text: task, completed: completed });
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function toggleTaskStatus(task) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks = tasks.map(t => {
        if (t.text === task) t.completed = !t.completed;
        return t;
    });
    localStorage.setItem("tasks", JSON.stringify(tasks));
}



// Load tasks from local storage
function loadTasks() {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    let taskList = document.getElementById("taskList");

    tasks.forEach(task => {
        let taskItem = document.createElement("li");
        let taskText = document.createElement("span");
        taskText.textContent = task.text;

        if (task.completed) taskText.classList.add("completed");
        taskText.onclick = function () {
            taskText.classList.toggle("completed");
            toggleTaskStatus(task.text);
        };


        let removeBtn = document.createElement("button");
        removeBtn.textContent = "X";
        removeBtn.onclick = function () {
            taskList.removeChild(taskItem);
            removeTaskFromStorage(task.task);
        };

        taskItem.appendChild(taskText);
        taskItem.appendChild(removeBtn);
        taskList.appendChild(taskItem);
    });
}

// Remove task from local storage
function removeTaskFromStorage(task) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks = tasks.filter(t => t !== task);
    localStorage.setItem("tasks", JSON.stringify(tasks));
}
