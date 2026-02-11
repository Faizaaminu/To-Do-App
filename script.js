


import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getDatabase,
    ref,
    push,
    set,
    onValue,
    update,
    remove,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyB42dmgn5UYc9aCFan9-AlcpqdYljhVALA",
    authDomain: "to-do-app-e5081.firebaseapp.com",
    databaseURL: "https://to-do-app-e5081-default-rtdb.firebaseio.com",
    projectId: "to-do-app-e5081",
    storageBucket: "to-do-app-e5081.firebasestorage.app",
    messagingSenderId: "632825686169",
    appId: "1:632825686169:web:0527a3d9b0d4ed7e0ff008",
    measurementId: "G-KHGB6NG8ZM"
};

const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");
const taskCount = document.getElementById("taskCount");
const emptyState = document.getElementById("emptyState");
const clearCompletedBtn = document.getElementById("clearCompletedBtn");
const filterButtons = document.querySelectorAll(".filter-btn");
const statusMessage = document.getElementById("statusMessage");

const STORAGE_KEY = "todoTasks";

let allTasks = [];
let activeFilter = "all";
let database = null;
let tasksRef = null;

const formatErrorDetail = (error) => {
    if (!error) {
        return "";
    }
    if (typeof error === "string") {
        return error;
    }
    if (typeof error === "object") {
        const code = error.code ? `(${error.code})` : "";
        const message = error.message ? ` ${error.message}` : "";
        return `${code}${message}`.trim();
    }
    return String(error);
};

const setStatus = (message, type = "info", detail = "") => {
    if (!statusMessage) {
        return;
    }

    if (!message) {
        statusMessage.textContent = "";
        statusMessage.style.display = "none";
        statusMessage.removeAttribute("data-type");
        return;
    }

    const extra = detail ? ` ${detail}` : "";
    statusMessage.textContent = `${message}${extra}`;
    statusMessage.dataset.type = type;
    statusMessage.style.display = "block";
};

const isFirebaseConfigured = Object.values(firebaseConfig).every((value) => {
    if (!value) {
        return false;
    }

    return !String(value).includes("YOUR_");
});

let useFirebase = isFirebaseConfigured;

if (useFirebase) {
    try {
        const app = initializeApp(firebaseConfig);
        database = getDatabase(app);
        tasksRef = ref(database, "tasks");
        setStatus("Connected to Firebase Realtime Database.", "info");
    } catch (error) {
        useFirebase = false;
        setStatus(
            "Firebase failed to initialize. Using local storage.",
            "error",
            formatErrorDetail(error)
        );
    }
} else {
    setStatus(
        "Firebase config missing. Using local storage on this device.",
        "info",
        "Update firebaseConfig in script.js to enable sync."
    );
}

const sanitize = (value) => value.replace(/[<>]/g, "");

const sortTasks = () => {
    allTasks.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
};

const loadLocalTasks = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        return [];
    }
};

const saveLocalTasks = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allTasks));
    } catch (error) {
        setStatus("Unable to save tasks to local storage.", "error");
    }
};

const createLocalId = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const renderTasks = () => {
    const filteredTasks = allTasks.filter((task) => {
        if (activeFilter === "active") {
            return !task.completed;
        }
        if (activeFilter === "completed") {
            return task.completed;
        }
        return true;
    });

    taskList.innerHTML = "";
    emptyState.style.display = filteredTasks.length === 0 ? "block" : "none";

    filteredTasks.forEach((task) => {
        const listItem = document.createElement("li");
        listItem.className = `task-item${task.completed ? " completed" : ""}`;
        listItem.dataset.id = task.id;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;
        checkbox.className = "task-check";
        checkbox.setAttribute("aria-label", "Mark task as completed");

        const text = document.createElement("span");
        text.className = "task-text";
        text.textContent = task.text;

        const actions = document.createElement("div");
        actions.className = "task-actions";

        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.dataset.action = "edit";

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.dataset.action = "delete";

        actions.append(editBtn, deleteBtn);
        listItem.append(checkbox, text, actions);
        taskList.appendChild(listItem);

        checkbox.addEventListener("change", () => {
            if (useFirebase && tasksRef) {
                update(ref(database, `tasks/${task.id}`), {
                    completed: checkbox.checked
                }).catch((error) => {
                    setStatus(
                        "Could not update task. Check Firebase rules.",
                        "error",
                        formatErrorDetail(error)
                    );
                });
                return;
            }

            const targetTask = allTasks.find((item) => item.id === task.id);
            if (targetTask) {
                targetTask.completed = checkbox.checked;
                saveLocalTasks();
                renderTasks();
            }
        });
    });

    taskCount.textContent = `${allTasks.length} task${allTasks.length === 1 ? "" : "s"}`;
};

const addTask = async () => {
    const value = taskInput.value.trim();
    if (!value) {
        taskInput.focus();
        return;
    }

    if (useFirebase && tasksRef) {
        try {
            const newTaskRef = push(tasksRef);
            await set(newTaskRef, {
                text: sanitize(value),
                completed: false,
                createdAt: serverTimestamp()
            });
            setStatus("Task added and synced.", "info");
        } catch (error) {
            setStatus(
                "Could not add task. Check Firebase rules.",
                "error",
                formatErrorDetail(error)
            );
        }
    } else {
        allTasks.push({
            id: createLocalId(),
            text: sanitize(value),
            completed: false,
            createdAt: Date.now()
        });
        sortTasks();
        saveLocalTasks();
        renderTasks();
    }

    taskInput.value = "";
    taskInput.focus();
};

addTaskBtn.addEventListener("click", addTask);

taskInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        addTask();
    }
});

taskList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
        return;
    }

    const action = target.dataset.action;
    if (!action) {
        return;
    }

    const listItem = target.closest(".task-item");
    if (!listItem) {
        return;
    }

    const taskId = listItem.dataset.id;
    if (!taskId) {
        return;
    }

    if (action === "edit") {
        const currentText = listItem.querySelector(".task-text")?.textContent ?? "";
        const updatedText = window.prompt("Update task", currentText);
        if (updatedText !== null) {
            const trimmed = updatedText.trim();
            if (trimmed) {
                if (useFirebase && tasksRef) {
                    update(ref(database, `tasks/${taskId}`), {
                        text: sanitize(trimmed)
                    }).catch((error) => {
                        setStatus(
                            "Could not update task. Check Firebase rules.",
                            "error",
                            formatErrorDetail(error)
                        );
                    });
                } else {
                    const targetTask = allTasks.find((item) => item.id === taskId);
                    if (targetTask) {
                        targetTask.text = sanitize(trimmed);
                        saveLocalTasks();
                        renderTasks();
                    }
                }
            }
        }
    }

    if (action === "delete") {
        if (useFirebase && tasksRef) {
            remove(ref(database, `tasks/${taskId}`)).catch((error) => {
                setStatus(
                    "Could not delete task. Check Firebase rules.",
                    "error",
                    formatErrorDetail(error)
                );
            });
        } else {
            allTasks = allTasks.filter((task) => task.id !== taskId);
            saveLocalTasks();
            renderTasks();
        }
    }
});

filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        filterButtons.forEach((btn) => btn.classList.remove("is-active"));
        button.classList.add("is-active");
        activeFilter = button.dataset.filter ?? "all";
        renderTasks();
    });
});

clearCompletedBtn.addEventListener("click", () => {
    if (useFirebase && tasksRef) {
        const updates = {};
        allTasks.forEach((task) => {
            if (task.completed) {
                updates[`tasks/${task.id}`] = null;
            }
        });

        if (Object.keys(updates).length > 0) {
            update(ref(database), updates).catch((error) => {
                setStatus(
                    "Could not clear tasks. Check Firebase rules.",
                    "error",
                    formatErrorDetail(error)
                );
            });
        }
        return;
    }

    allTasks = allTasks.filter((task) => !task.completed);
    saveLocalTasks();
    renderTasks();
});

if (useFirebase && tasksRef) {
    onValue(
        tasksRef,
        (snapshot) => {
            const data = snapshot.val() || {};
            allTasks = Object.entries(data)
                .map(([id, task]) => ({
                    id,
                    text: task.text ?? "",
                    completed: Boolean(task.completed),
                    createdAt: task.createdAt ?? 0
                }))
                .sort((a, b) => a.createdAt - b.createdAt);

            renderTasks();
        },
        (error) => {
            setStatus(
                "Firebase permission denied. Using local storage.",
                "error",
                formatErrorDetail(error)
            );
            useFirebase = false;
            allTasks = loadLocalTasks();
            sortTasks();
            renderTasks();
        }
    );
} else {
    allTasks = loadLocalTasks();
    sortTasks();
    renderTasks();
}
