import { Component, signal } from '@angular/core';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  showAlert(){
    Swal.fire({
      position: 'top-end',
      text: 'Operation completed successfully.',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      background: '#009183',
      color: 'white'
    });
  }
}
