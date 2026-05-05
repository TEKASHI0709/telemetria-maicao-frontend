import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User, Rol } from '../../core/services/user';

@Component({
  selector: 'app-users-admin',
  imports: [CommonModule, FormsModule],
  templateUrl: './users-admin.html',
  styleUrl: './users-admin.css'
})
export class UsersAdmin implements OnInit {
  users: User[] = [];
  roles: Rol[] = [];
  loading = true;
  saving = false;
  
  showModal = false;
  showDeleteModal = false;
  editMode = false;
  editingUserId: number | null = null;
  userToDelete: User | null = null;
  formError = '';

  formData = {
    username: '',
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    is_active: true,
    selectedRole: 'usuario' as 'usuario' | 'admin'
  };

  activeUsers = 0;
  adminUsers = 0;

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRoles();
    this.loadUsers();
  }

  loadRoles(): void {
    this.userService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
      },
      error: (err) => {
        console.error('Error cargando roles:', err);
      }
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getAll().subscribe({
      next: (users) => {
        this.users = users;
        this.activeUsers = users.filter(u => u.is_active).length;
        this.adminUsers = users.filter(u => this.hasAdminRole(u)).length;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando usuarios:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  hasAdminRole(user: User): boolean {
    return user.roles?.some(r => r.nombre === 'Administrador') === true;
  }

  openCreateModal(): void {
    this.editMode = false;
    this.editingUserId = null;
    this.formData = {
      username: '',
      email: '',
      password: '',
      nombre: '',
      apellido: '',
      is_active: true,
      selectedRole: 'usuario'
    };
    this.formError = '';
    this.showModal = true;
  }

  openEditModal(user: User): void {
    this.editMode = true;
    this.editingUserId = user.id;
    this.formData = {
      username: user.username,
      email: user.email || '',
      password: '',
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      is_active: user.is_active,
      selectedRole: this.hasAdminRole(user) ? 'admin' : 'usuario'
    };
    this.formError = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.formError = '';
  }

  selectRole(role: 'usuario' | 'admin'): void {
    this.formData.selectedRole = role;
  }

  saveUser(): void {
    if (!this.formData.username || !this.formData.nombre || !this.formData.apellido) {
      this.formError = 'Por favor completa todos los campos obligatorios';
      return;
    }

    if (!this.editMode && !this.formData.password) {
      this.formError = 'La contraseña es obligatoria para nuevos usuarios';
      return;
    }

    const roleName = this.formData.selectedRole === 'admin' ? 'Administrador' : 'Usuario';
    const role = this.roles.find(r => r.nombre === roleName);

    if (!role) {
      this.formError = 'No se encontró el rol seleccionado';
      return;
    }

    this.saving = true;
    this.formError = '';

    if (this.editMode && this.editingUserId) {
      const updateData: any = {
        email: this.formData.email,
        nombre: this.formData.nombre,
        apellido: this.formData.apellido,
        is_active: this.formData.is_active,
        roles: [role.id]
      };
      
      this.userService.update(this.editingUserId, updateData).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadUsers();
        },
        error: (err) => {
          this.saving = false;
          this.formError = 'Error al actualizar el usuario';
          this.cdr.detectChanges();
        }
      });
    } else {
      const createData = {
        username: this.formData.username,
        email: this.formData.email,
        password: this.formData.password,
        nombre: this.formData.nombre,
        apellido: this.formData.apellido,
        is_active: this.formData.is_active,
        roles: [role.id]
      };

      this.userService.create(createData).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadUsers();
        },
        error: (err) => {
          this.saving = false;
          this.formError = err.error?.detail || 'Error al crear el usuario. Verifica que el username no exista.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  confirmDelete(user: User): void {
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.userToDelete = null;
  }

  deleteUser(): void {
    if (!this.userToDelete) return;
    
    this.userService.delete(this.userToDelete.id).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.userToDelete = null;
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error eliminando usuario:', err);
        this.showDeleteModal = false;
      }
    });
  }
}