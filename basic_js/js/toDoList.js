const toDoForm = document.getElementById("todo-form");
const toDoInput = toDoForm.querySelector("input");
const toDoList = document.getElementById("todo-list");

const TODOS_KEY = "todos";

let toDos = [];
const savedToDos = localStorage.getItem(TODOS_KEY);

const saveToDos = () => {
  localStorage.setItem("todos", JSON.stringify(toDos));
};

const paintTodo = (newTodo) => {
  const li = document.createElement("li");
  const span = document.createElement("span");
  const button = document.createElement("button");

  li.id = newTodo.id;
  span.innerText = newTodo.text;
  button.innerText = "삭제";
  button.addEventListener("click", (event) => {
    const li = event.target.parentElement;
    toDos = toDos.filter((toDo) => toDo.id !== li.id);
    saveToDos();
    li.remove();
  });

  li.appendChild(span);
  li.appendChild(button);
  toDoList.appendChild(li);
};

toDoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const newTodo = toDoInput.value;
  const newTodoObj = {
    id: String(Date.now()),
    text: newTodo,
  };
  toDoInput.value = "";
  toDos.push(newTodoObj);
  paintTodo(newTodoObj);
  saveToDos();
});

if (savedToDos) {
  const parsedToDos = JSON.parse(savedToDos);
  toDos = parsedToDos;
  parsedToDos.forEach(paintTodo);
} else {
}
