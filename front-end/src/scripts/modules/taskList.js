const listTasksUl = document.querySelector('.tasks-container ul');




const taskItems = listTasksUl.querySelectorAll('li');

taskItems.forEach(taskItem => {
  console.log('Task Item:', taskItem);

  taskItem.addEventListener('click', () => {
    console.log('Task item clicked');
     const taskDescription = taskItem.querySelector('.description');
     const controls = taskItem.querySelector('.controls');

     console.log('Task Description:', taskDescription);
    taskDescription.classList.toggle('expanded');
    controls.classList.toggle('expanded');
    taskItem.classList.toggle('focused');
      
  });
  
});


taskItems.forEach(taskItem => {
    const checkbox = taskItem.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => {
        console.log('Checkbox changed for task item');
    });
    });


   