const closeBtn = document.querySelector('.close-btn');
const openBtn = document.querySelector('.menu');
const mobileMenu = document.querySelector('.mobile-menu');
const inputs = document.querySelectorAll('.inputBx input');
const errors = document.querySelectorAll('.error');
const todoList = document.querySelector('.todo-list');
let taskList = []
let active = []
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
})


//  move the input labels topside when the page reloads
window.addEventListener('load', () => {
    inputs.forEach((input) => {
        const label = input.parentElement.querySelector('span')
        if (input.value != '')
        {
            label.classList.add('active');
        }
        else
        {
            label.classList.remove('active');
        }
    })
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

//  Get all tasks
fetch('/tasks')
.then(response => response.json())
.then(data => {
    active = data
    taskList = data;
    renderTasks()
    //  Handle users marking a task as complete
    handleCompleteTasks()

    //  Filter Options
    filterOptions()

})




function renderTasks() {
    let todos = ""
    var activeTasks = 0
    for (let task of taskList) {
        if (task.complete == 0)
        {
            activeTasks += 1
        }
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
    if (active.length > 0)
    {
        todos += `
    <li class="item">
        <div class="num-items">${activeTasks} item(s) left</div>
        <div class="controls">
            <a href="#">All</a>
            <a href="#">Active</a>
            <a href="#">Completed</a>
        </div>
        <a href="/delete_task/completed">Clear Completed</a>
    </li>
    `
    }
    todoList.innerHTML = todos;
    completeBtns = todoList.querySelectorAll('.mark-complete');
}


function handleCompleteTasks()
{
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
}

function filterOptions()
{
    const controlBtns = todoList.querySelectorAll('.controls a');
    controlBtns.forEach((controlBtn) => {
        controlBtn.addEventListener('click', () => {
            let status = controlBtn.innerHTML.toLowerCase()
            if (status == "all")
            {
                fetch('/tasks')
                .then(res => res.json())
                .then(data => {
                    taskList = data;
                    renderTasks()
                    //  Handle users marking a task as complete
                    handleCompleteTasks()
                    filterOptions()
                })
                controlBtn.classList.add('active');
            }
            else if (status == "active")
            {
                fetch('/tasks/active')
                .then(res => res.json())
                .then(data => {
                    taskList = data;
                    renderTasks()
                    //  Handle users marking a task as complete
                    handleCompleteTasks()
                    filterOptions()
                })
            }
            else if (status == "completed")
            {
                fetch('/tasks/completed')
                .then(res => res.json())
                .then(data => {
                    taskList = data
                    renderTasks()
                    //  Handle users marking a task as complete
                    handleCompleteTasks()
                    filterOptions()
                    setTimeout(() => {
                        controlBtn.classList.add('active')
                    },2000)
                })
            }
            
        })
    })
}