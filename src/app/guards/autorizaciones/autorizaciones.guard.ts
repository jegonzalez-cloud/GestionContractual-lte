import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AutorizacionesGuard implements CanActivate {

  constructor(private router: Router) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): boolean{

    let rol:any = (localStorage.getItem('rol') !== null) ? atob(localStorage.getItem('rol')!) : '';
    console.log(rol);
    if(rol == '' || rol < 40 && rol > 44){
      this.router.navigate(['busqueda']);
      return false;
    }
    else{
      return true;
    }

  }

}
