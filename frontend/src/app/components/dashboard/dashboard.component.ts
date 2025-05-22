import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { TaskService, Task } from '../../services/task.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class DashboardComponent implements OnInit {
  @ViewChild('taskForm') taskForm: NgForm;
  
  tasks: Task[] = [];
  newTask: Omit<Task, '_id'> = {
    title: '',
    description: '',
    completed: false
  };
  error = '';
  isEditing = false;
  editingTaskId: string | null = null;
  formTitle = 'Add New Task';
  submitButtonText = 'Add Task';

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
      },
      error: (err) => {
        this.error = 'Failed to load tasks';
        console.error(err);
      }
    });
  }

  createTask(): void {
    if (!this.newTask.title.trim()) {
      this.error = 'Title is required';
      return;
    }

    if (this.isEditing && this.editingTaskId) {
      // Update existing task
      const updatedTask: Task = {
        _id: this.editingTaskId,
        ...this.newTask
      };
      
      this.taskService.updateTask(this.editingTaskId, updatedTask).subscribe({
        next: () => {
          this.resetForm();
          this.loadTasks();
          this.error = '';
        },
        error: (err) => {
          this.error = 'Failed to update task';
          console.error(err);
        }
      });
    } else {
      // Create new task
      this.taskService.createTask(this.newTask).subscribe({
        next: () => {
          this.resetForm();
          this.loadTasks();
          this.error = '';
        },
        error: (err) => {
          this.error = 'Failed to create task';
          console.error(err);
        }
      });
    }
  }

  updateTask(task: Task): void {
    this.taskService.updateTask(task._id!, task).subscribe({
      next: () => {
        this.loadTasks();
        this.error = '';
      },
      error: (err) => {
        this.error = 'Failed to update task';
        console.error(err);
      }
    });
  }

  deleteTask(taskId: string): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(taskId).subscribe({
        next: () => {
          this.loadTasks();
          this.error = '';
        },
        error: (err) => {
          this.error = 'Failed to delete task';
          console.error(err);
        }
      });
    }
  }

  toggleComplete(task: Task): void {
    this.updateTask({ ...task, completed: !task.completed });
  }

  editTask(task: Task): void {
    this.isEditing = true;
    this.editingTaskId = task._id;
    this.newTask = {
      title: task.title,
      description: task.description,
      completed: task.completed
    };
    this.formTitle = 'Edit Task';
    this.submitButtonText = 'Update Task';
    
    // Scroll to the form
    document.querySelector('.task-form')?.scrollIntoView({ behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.isEditing = false;
    this.editingTaskId = null;
    this.newTask = { title: '', description: '', completed: false };
    this.formTitle = 'Add New Task';
    this.submitButtonText = 'Add Task';
    if (this.taskForm) {
      this.taskForm.resetForm();
    }
  }
}
