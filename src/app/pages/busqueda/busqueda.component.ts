import {Component, OnInit, ViewChild,Inject,LOCALE_ID} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {SecopService} from "../../services/secop/secop.service";
import {MatTableDataSource} from "@angular/material/table";
import * as utils from "../../utils/functions";
import {Router} from "@angular/router";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {AuthService} from "../../services/auth/auth.service";
import Swal from "sweetalert2";
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import * as moment from "moment";
import * as pdfMake from "pdfmake/build/pdfmake";
import {CurrencyPipe, formatCurrency} from '@angular/common';
import * as func from "../../utils/functions";
import {ServicesService} from "../../services/services.service";

@Component({
  selector: 'app-busqueda',
  templateUrl: './busqueda.component.html',
  styleUrls: ['./busqueda.component.css']
})
export class BusquedaComponent implements OnInit {
  private entidad = atob(localStorage.getItem('entidad')!);
  private centroGestor = atob(localStorage.getItem('centroGestor')!);
  displayedColumns: string[] = ['Num','Identificacion', 'Nombre', 'Estado', 'Fecha', 'Creador', 'ValorOferta'];
  private token: string = localStorage.getItem('token')!;
  private codigoEntidad: string = atob(localStorage.getItem('codigoEntidad')!);
  private username: string = atob(localStorage.getItem('username')!);
  ROL: any = atob(localStorage.getItem('rol')!);
  info_process: any = [];
  dataSource!: MatTableDataSource<any>;
  busquedaForm!: FormGroup;
  proveedores!: any;
  creador!: any;
  gestor!: any;
  busqueda!:any;
  DESCRIPCION_PROCESO: any;
  COD_PROV: any;
  NOM_PROV: any;
  CORREO_PROV: any;
  CELULAR_PROV: any;
  TIP_IDEN_PROV: any;
  DPTO_PROV: any;
  CIUDAD_PROV: any;
  CATE_CONTRATACION: any;
  UBICACION_PROV: any;
  NACIMIENTO_PROV: any;
  GENERO_PROV: any;
  PROFESION_PROV: any;
  JUST_TIPO_PROCESO: any;
  EQUIPO_CONTRATACION: any;
  UNI_CONTRATACION: any;
  DOCUMENTOS_TIPO: any;
  INTERADMINISTRATIVOS: any;
  DEFINIR_LOTES: any;
  FECHA_INICIO: any;
  FECHA_TERMINO: any;
  FIRMA_CONTRATO: any;
  PLAZO_EJECUCION: any;
  PLAN_PAGOS: any;
  VAL_OFERTA: any;
  TIEMPO_DURACION_CONTRATO: any;
  DURACION_CONTRATO: any;
  TIPO_PROCESO!: any;
  TIPO_CONTRATO!: any;
  NOMBRE_PROCESO!: any;
  PROCESO_SELECCIONADO!:any;
  PROCESO!: any;
  ESTADO!: any;
  CENTRO_GESTOR!: any;
  CODIGO_RPC!: any;
  infoPagos!: any;
  cantidadCuotas:any;
  ENTIDAD = atob(localStorage.getItem('entidad')!);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('closebutton') closebutton:any;
  @ViewChild('openbutton') openbutton:any;
  verDescuentos: any = [];
  CDPFIELDS: any = [];
  UNSPSCFIELDS: any = [];
  public autorizaciones: any;

  constructor(private service: ServicesService,private secopService: SecopService, private fb: FormBuilder,private router:Router,private authService:AuthService,@Inject(LOCALE_ID) public locale: string) {
  }

  ngOnInit(): void {
    this.validateToken();
    this.getProveedores();
    this.getCreadorProceso();
    this.getcentroGestor();
    this.formulario();
  }

  searchData() {
    let identificacion = (this.busquedaForm.controls['identificacion'].value == null) ? '' : this.busquedaForm.controls['identificacion'].value ;
    let proveedor = this.busquedaForm.controls['proveedor'].value;
    let creador = this.busquedaForm.controls['creador'].value;
    let proceso = this.busquedaForm.controls['proceso'].value;
    let centroGestor = (this.busquedaForm.controls['centroGestor'].value.length == 0) ? this.centroGestor : this.busquedaForm.controls['centroGestor'].value ;

    this.secopService.getSearchDataTable(identificacion,proveedor,creador,proceso,centroGestor).subscribe((response:any)=>{
      this.busqueda = response.Values.ResultFields;
      this.infoProcess();
      if(this.busqueda != null){
        utils.showAlert('Busqueda Exitosa!','success');
      }
      else{
        utils.showAlert('No se encontraron registros!','warning');
      }

    },(error:any) => {
      utils.showAlert('Busqueda Errornea!!','Error');
    })
  }

  getProveedores() {
    this.secopService.getProveedores(this.entidad, this.ROL).subscribe((response: any) => {
      this.proveedores = response.Values.ResultFields;
    })
  }

  getCreadorProceso() {
    this.secopService.getCreadorProceso(this.entidad, this.ROL).subscribe((response: any) => {
      this.creador = response.Values.ResultFields;
    })
  }

  getcentroGestor() {
    this.secopService.getDependenciasSecop(this.entidad, this.ROL).subscribe((response: any) => {
      this.gestor = response.Values.ResultFields;
    })
  }

  getTableData() {

  }

  formulario() {
    this.busquedaForm = this.fb.group({
      token: new FormControl(atob(localStorage.getItem('token')!)),
      username: new FormControl(atob(localStorage.getItem('username')!)),
      codigoEntidad: new FormControl(atob(localStorage.getItem('codigoEntidad')!)),
      identificacion: new FormControl({value: null, disabled: false}),
      proveedor: new FormControl({value: '', disabled: false}),
      creador: new FormControl({value: '', disabled: false}),
      proceso: new FormControl({value: '', disabled: false}),
      centroGestor: new FormControl({value:'',disabled:false})
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  infoProcess(): void {
    if (this.busqueda != null && this.busqueda.length > 0) {
      this.dataSource = new MatTableDataSource(this.busqueda!);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    } else {
      this.dataSource = new MatTableDataSource();
      //utils.showAlert('Error de información', 'error');
    }
  }

  goDetail(row: any) {
    this.secopService.getSelectedProcess(this.token,row.CONS_PROCESO).subscribe((response: any) => {
      this.PROCESO_SELECCIONADO = response.Values.ResultFields[0][0];
      // console.log(response.Values.ResultFields);
      this.CENTRO_GESTOR = response.Values.ResultFields[0][0].CENTRO_GESTOR;
      this.PROCESO = response.Values.ResultFields[0][0].CONS_PROCESO;
      this.TIPO_PROCESO = response.Values.ResultFields[0][0].TIPO_PROCESO;
      this.TIPO_CONTRATO = response.Values.ResultFields[0][0].TIPO_CONTRATO;
      this.NOMBRE_PROCESO = response.Values.ResultFields[0][0].NOMBRE_PROCESO;
      this.DESCRIPCION_PROCESO = response.Values.ResultFields[0][0].DESCRIPCION_PROCESO;
      this.COD_PROV = response.Values.ResultFields[0][0].COD_PROV;
      this.NOM_PROV = response.Values.ResultFields[0][0].NOM_PROV;
      this.NACIMIENTO_PROV = response.Values.ResultFields[0][0].NACIMIENTO_PROV;
      this.CORREO_PROV = response.Values.ResultFields[0][0].CORREO_PROV;
      this.CELULAR_PROV = response.Values.ResultFields[0][0].CELULAR_PROV;
      this.TIP_IDEN_PROV = response.Values.ResultFields[0][0].TIP_IDEN_PROV;
      this.DPTO_PROV = response.Values.ResultFields[0][0].DPTO_PROV;
      this.CIUDAD_PROV = response.Values.ResultFields[0][0].CIUDAD_PROV;
      this.UBICACION_PROV = response.Values.ResultFields[0][0].UBICACION_PROV;
      this.CATE_CONTRATACION = response.Values.ResultFields[0][0].CATE_CONTRATACION;
      this.GENERO_PROV = response.Values.ResultFields[0][0].GENERO_PROV;
      this.PROFESION_PROV = response.Values.ResultFields[0][0].PROFESION_PROV;
      this.JUST_TIPO_PROCESO = response.Values.ResultFields[0][0].JUST_TIPO_PROCESO;
      this.EQUIPO_CONTRATACION = response.Values.ResultFields[0][0].EQUIPO_CONTRATACION;
      this.UNI_CONTRATACION = response.Values.ResultFields[0][0].UNI_CONTRATACION;
      this.DOCUMENTOS_TIPO = response.Values.ResultFields[0][0].DOCUMENTOS_TIPO;
      this.INTERADMINISTRATIVOS = response.Values.ResultFields[0][0].INTERADMINISTRATIVOS;
      this.DEFINIR_LOTES = response.Values.ResultFields[0][0].DEFINIR_LOTES;
      this.ESTADO = response.Values.ResultFields[0][0].ESTADO;

      this.CODIGO_RPC = response.Values.ResultFields[0][0].CODIGO_RPC;
      this.FECHA_INICIO = response.Values.ResultFields[0][0].FECHA_INICIO;
      this.FECHA_TERMINO = response.Values.ResultFields[0][0].FECHA_TERMINO;
      this.FIRMA_CONTRATO = response.Values.ResultFields[0][0].FIRMA_CONTRATO;
      this.PLAZO_EJECUCION = response.Values.ResultFields[0][0].PLAZO_EJECUCION;
      this.PLAN_PAGOS = response.Values.ResultFields[0][0].PLAN_PAGOS;
      this.VAL_OFERTA = response.Values.ResultFields[0][0].VAL_OFERTA;
      this.TIEMPO_DURACION_CONTRATO  = response.Values.ResultFields[0][0].TIEMPO_DURACION_CONTRATO ;
      this.DURACION_CONTRATO = response.Values.ResultFields[0][0].DURACION_CONTRATO;

      console.log(response.Values.ResultFields[1][0]);
      console.log(response.Values.ResultFields[1].length);
      this.CDPFIELDS = response.Values.ResultFields[1];
      this.UNSPSCFIELDS = response.Values.ResultFields[2];

      // this.autorizaciones = response.Values.ResultFields;
    });
  }

  fillModal(numProceso:any) {
    // console.log(numProceso)
    this.router.navigate(['home/autorizaciones-det/'+numProceso]);
  }

  private validateToken() {
    this.authService.isLogin().subscribe((response:any)=>{
      // console.log(response);
      if(response.Status == 'Fail' || response.Token == '-1'){
        this.router.navigate(['login']);
      }
    })
  }

  public async getPagosXRpc(proceso:any){
    this.secopService.getRpcFromProcess(proceso).subscribe((response: any) => {
      if (response.Status != 'Ok') {
        utils.showAlert('No se encontro un RPC asociado al proceso', 'error');
        return;
      }
      else{
        let rpc = response.Values.ResultFields;
        if (rpc != null && rpc.toString().length == 10) {
          this.secopService.getPagosXRpc(this.token, rpc).subscribe((response: any) => {
            if (response.Status != 'Ok') {
              utils.showAlert('Rpc no encontrado, por favor intente de nuevo!', 'error');
            } else {
              this.infoPagos = response.Values.ResultFields;
              this.cantidadCuotas = this.infoPagos.length
              utils.showAlert('Consulta exitosa!', 'success');
              this.onOpen();
            }
          });
        } else {
          utils.showAlert('No se encontro un codigo Rpc asociado!', 'error');
        }
      }
    });
  }

  public onSave() {
    this.closebutton.nativeElement.click();
  }

  public onOpen(){
    this.openbutton.nativeElement.click();
  }

  generateReports() {
    func.generarReporte(this.infoPagos, this.locale,this.CENTRO_GESTOR,this.NOM_PROV,this.COD_PROV);
  }

  WatchDescuento(infopago:any) {
    if (this.verDescuentos[infopago[0]]) {
      this.verDescuentos[infopago[0]] = false;
    } else {
      this.verDescuentos[infopago[0]] = true;
    }
  }

  anularProceso(proceso: string) {
    this.secopService.updateProcess(proceso, this.ROL, this.entidad, this.codigoEntidad, this.username, 'anulado').subscribe((response: any) => {
      this.service.sendClickEvent();
      if (response.Status = 'Ok') {
        utils.showAlert('Se Anulo el proceso #' + proceso + '!', 'warning');
        this.getdataProcess();
      }
    });
  }

  getdataProcess() {
    this.secopService.getDataProcess('0001', 1,this.centroGestor).subscribe((data: any) => {
      this.info_process = data;
      this.infoProcess();
    });
  }

  aprobarAutorizacion(proceso:string){
    this.secopService.updateProcess(proceso,this.ROL,this.entidad,this.codigoEntidad,this.username,'aprobado').subscribe((response:any)=>{
      this.service.sendClickEvent();
      if(response.Status = 'Ok'){
        utils.showAlert('Se autorizo el proceso #'+proceso+ ' correctamente!','success');
        //disparar creacion secop segun rol
        // if(this.ROL == 44){
        if(this.ROL == 6){
          //console.log('aqui vamos');
          this.secopService.getUnspscData(this.token,proceso).subscribe((response:any)=>{
            // console.log('aqui estamos');
            // console.log(this.token);
            // console.log(response);
            let usuarioConect = atob(localStorage.getItem('usuarioConect')!);
            let conectPw = atob(localStorage.getItem('conectPw')!);
            let arr: Array<any> = [];
            arr.push(this.PROCESO_SELECCIONADO);
            arr.push(response.Values.ResultFields);
            arr.push({"USUARIO_CONNECT":usuarioConect});
            arr.push({"PASSWORD_CONNECT":conectPw});
            arr.push({"USC_CODIGO_ENTIDAD":this.codigoEntidad});
            arr.push({"TOKEN":this.token});

            this.secopService.createSoapProcess(arr).subscribe((response:any)=>{
              console.log(response);
            });
            //utils.sendSoapData(this.PROCESO_SELECCIONADO,response.Values.ResultFields);
          });

        }
        this.getAutorizacionesXEntidad();
      }
    });
  }

  rechazarAutorizacion(proceso:string){
    this.secopService.updateProcess(proceso,this.ROL,this.entidad,this.codigoEntidad,this.username,'rechazado').subscribe((response:any)=>{
      this.service.sendClickEvent();
      if(response.Status = 'Ok'){
        utils.showAlert('Se rechazo el proceso #'+proceso+ '!','warning');
        this.getAutorizacionesXEntidad();
      }
    });
  }

  getAutorizacionesXEntidad(){
    this.secopService.getAutorizacionesXEntidad(this.entidad).subscribe((response:any)=>{
      this.autorizaciones = response.Values.ResultFields;
      // console.log(this.autorizaciones);
      this.infoProcess();
    });
  }

  validarAnulacion(proceso: string) {
    Swal.fire({
      title: 'Esta Seguro?',
      text: "Esta accion no se podrá revertir!",
      icon: 'warning',
      showCancelButton: true,
      allowOutsideClick: false,
      confirmButtonColor: 'var(--companyColor)',
      cancelButtonColor: '#E9ECEF',
      confirmButtonText: 'Si, anular proceso!',
      cancelButtonText: 'No, deseo revisar!',
      reverseButtons: true
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.anularProceso(proceso);
      }
    });
  }

}
