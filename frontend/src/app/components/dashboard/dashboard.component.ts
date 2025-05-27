import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { TaskService, Task } from '../../services/task.service';
import { finalize } from 'rxjs/operators';

type FilterType = 'all' | 'active' | 'completed';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe]
})
export class DashboardComponent implements OnInit {
  @ViewChild('taskForm', { static: false }) taskForm: NgForm;
  
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
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
  isLoading = false;
  showForm = false;
  currentFilter: FilterType = 'all';
  showDeleteModal = false;
  taskToDelete: Task | null = null;

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.isLoading = true;
    this.error = '';
    
    this.taskService.getTasks().pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.applyFilter();
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

    this.error = '';
    this.isLoading = true;

    if (this.isEditing && this.editingTaskId) {
      // Update existing task
      const updatedTask: Task = {
        _id: this.editingTaskId,
        ...this.newTask
      };
      
      this.taskService.updateTask(this.editingTaskId, updatedTask).pipe(
        finalize(() => this.isLoading = false)
      ).subscribe({
        next: () => {
          this.resetForm();
          this.loadTasks();
        },
        error: (err) => {
          this.error = 'Failed to update task: ' + (err.message || 'Unknown error');
          console.error(err);
        }
      });
    } else {
      // Create new task
      this.taskService.createTask(this.newTask).pipe(
        finalize(() => this.isLoading = false)
      ).subscribe({
        next: () => {
          this.resetForm();
          this.loadTasks();
        },
        error: (err) => {
          this.error = 'Failed to create task: ' + (err.message || 'Unknown error');
          console.error(err);
        }
      });
    }
  }

  updateTask(task: Task): void {
    this.isLoading = true;
    this.error = '';
    
    this.taskService.updateTask(task._id!, task).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: () => {
        this.loadTasks();
      },
      error: (err) => {
        this.error = 'Failed to update task: ' + (err.message || 'Unknown error');
        console.error(err);
      }
    });
  }

  confirmDelete(task: Task): void {
    this.taskToDelete = task;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.taskToDelete = null;
    this.showDeleteModal = false;
  }

  deleteTask(taskId: string): void {
    this.isLoading = true;
    this.error = '';
    this.showDeleteModal = false;
    
    this.taskService.deleteTask(taskId).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: () => {
        this.loadTasks();
        this.taskToDelete = null;
      },
      error: (err) => {
        this.error = 'Failed to delete task: ' + (err.message || 'Unknown error');
        console.error(err);
      }
    });
  }

  toggleComplete(task: Task): void {
    this.updateTask({ ...task, completed: !task.completed });
  }

  editTask(task: Task): void {
    this.isEditing = true;
    this.editingTaskId = task._id;
    this.showForm = true;
    
    // Set the form values
    this.newTask = {
      title: task.title,
      description: task.description,
      completed: task.completed
    };
    this.formTitle = 'Edit Task';
    this.submitButtonText = 'Update Task';
    
    // Scroll to the form
    setTimeout(() => {
      document.querySelector('.task-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (this.showForm) {
      this.resetForm();
      setTimeout(() => {
        document.querySelector('.task-form')?.scrollIntoView({ behavior: 'smooth' });
      }, 0);
    }
  }

  cancelEdit(): void {
    this.resetForm();
    this.showForm = false;
  }

  filterTasks(filter: FilterType): void {
    this.currentFilter = filter;
    this.applyFilter();
  }

  applyFilter(): void {
    switch (this.currentFilter) {
      case 'active':
        this.filteredTasks = this.tasks.filter(task => !task.completed);
        break;
      case 'completed':
        this.filteredTasks = this.tasks.filter(task => task.completed);
        break;
      default:
        this.filteredTasks = [...this.tasks];
    }
  }

  resetForm(): void {
    this.isEditing = false;
    this.editingTaskId = null;
    this.newTask = { title: '', description: '', completed: false };
    this.formTitle = 'Add New Task';
    this.submitButtonText = 'Add Task';
    this.error = '';
    
    // Reset form state if it exists
    if (this.taskForm) {
      this.taskForm.form.markAsPristine();
      this.taskForm.form.markAsUntouched();
    }
  }
}
