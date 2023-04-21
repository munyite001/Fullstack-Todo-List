const closeBtn = document.querySelector('.close-btn');
const openBtn = document.querySelector('.menu');
const mobileMenu = document.querySelector('.mobile-menu');
const inputs = document.querySelectorAll('.inputBx input');
const errors = document.querySelectorAll('.error');
const todoList = document.querySelector('.todo-list');
let taskList = []
let completeBtns;

// Open The mobile Menu
openBtn.addEventListener('click', () => {
    mobileMenu.classList.add('show-btn');
})

//  Close The mobile Menu
closeBtn.addEventListener('click', () => {
    mobileMenu.classList.remove('show-btn');
})

//  move the input labels topside, if the input value has content
inputs.forEach((input) => {
    input.addEventListener('input', (e) => {
    const label = e.currentTarget.parentElement.querySelector('span')
    if (input.value != '')
    {
        label.classList.add('active');
    }
    else
    {
        label.classList.remove('active');
    }
    })
    if (input .value != '')
    {
        input.parentElement.querySelector('span').classList.remove('active')     
    }
})

//  Hide the error messages after a few minutes
errors.forEach((error) => {
    if (error.innerHTML != '')
    {
        setTimeout(() => {
            error.innerHTML = ''
        }, 5000)
    }
})

fetch('/tasks')
.then(response => response.json())
.then(data => {
    taskList = data;
    renderTasks()
    completeBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('task-complete');
            btn.parentElement.classList.toggle('complete');
            let id = parseInt(btn.parentElement.dataset.id);
            let options = {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: {'id': id}
            }
            fetch(`/update-task/${id}`, options)
        })
    })
})




function renderTasks() {
    let todos = ""
    for (let task of taskList) {
        console.log("Complete Status: ", task.complete)
        if (task.complete == 1)
        {
            todos += `
            <li class="item complete" draggable="true" data-id=${task.task_id}>
                <span class="mark-complete task-complete">
                     <img src="../static/images/icon-check.svg" alt="">
                </span>
                ${task.body}
                <a href="/delete_task/${task.task_id}" class="delete-task">
                    <img src="../static/images/icon-cross.svg" alt="">
                </a>
            </li>
        `
        }
        else if (task.complete == 0)
        {
            todos += `
            <li class="item" draggable="true" data-id=${task.task_id}>
                <span class="mark-complete">
                     <img src="../static/images/icon-check.svg" alt="">
                </span>
                ${task.body}
                <a href="/delete_task/${task.task_id}" class="delete-task">
                    <img src="../static/images/icon-cross.svg" alt="">
                </a>
            </li>
        `
        }
    }
    todoList.innerHTML = todos;
    completeBtns = todoList.querySelectorAll('.mark-complete');
}