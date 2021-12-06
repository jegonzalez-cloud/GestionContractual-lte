import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { SidebarComponent } from './sidebar/sidebar/sidebar.component';
import { FooterComponent } from './footer/footer/footer.component';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import {MatTooltipModule} from "@angular/material/tooltip";

@NgModule({
  declarations: [NavbarComponent, SidebarComponent, FooterComponent],
    imports: [CommonModule, TranslateModule, RouterModule, MatTooltipModule],
  exports: [
    NavbarComponent,
    SidebarComponent,
    FooterComponent,
    TranslateModule,
    RouterModule
  ],
})
export class SharedModule {}
