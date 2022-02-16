import {AfterViewInit, Component, Inject, LOCALE_ID, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormControl, FormGroup} from "@angular/forms";
import * as moment from 'moment';
import {SecopService} from "../../services/secop/secop.service";
import * as pdfMake from "pdfmake/build/pdfmake";
import * as XLSX from 'xlsx';
import * as utils from "../../utils/functions";
import Swal from "sweetalert2";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from '@angular/material/sort';
import {ModalService} from "../../services/modal/modal.service";
import {ApexChart, ApexNonAxisChartSeries, ApexResponsive, ChartComponent} from "ng-apexcharts";
import {map} from "rxjs/operators";
import {from} from "rxjs";

export interface UserData {
  CONS_PROCESO: string;
  COD_PROV: string;
  NOM_PROV: string;
  ESTADO: string;
  CREATED: string;
  USR_LOGIN: string;
  VAL_OFERTA: string;
}

export type ChartOptions = {
  series: ApexNonAxisChartSeries | any;
  chart: ApexChart | any;
  responsive: ApexResponsive[] | any;
  labels: any;
};

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent implements OnInit {
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions!: Partial<ChartOptions> | any;
  // displayedColumnsGrafica1: string[] = ['Dependencia', 'Cantidad', 'Estado', 'Valor Total'];
  dataSourceGrafica1!: MatTableDataSource<any>;
  reportesForm!: FormGroup;
  CENTROGESTOR = atob(localStorage.getItem('centroGestor')!);
  ENTIDAD = atob(localStorage.getItem('entidad')!);
  ROL: any = atob(localStorage.getItem('rol')!);
  private token: string = localStorage.getItem('token')!;
  reporteActivo: any;
  RESPONSE: any = null;
  gestor: any;
  hideTable: boolean = true;
  fileName = 'Reporte_' + moment().format().slice(0, -6) + '.xlsx';

  //TABLE
  // displayedColumns: string[] = ['id', 'name', 'progress', 'fruit'];
  displayedColumns: string[] = ['CONS_PROCESO', 'COD_PROV', 'NOM_PROV', 'ESTADO', 'CREATED', 'USR_LOGIN', 'VAL_OFERTA'];
  dataSource!: MatTableDataSource<UserData>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  private pendiente!:number;

  //END TABLE
  private creado!: number;
  private anulado!: number;
  private rechazado!: number;
  private aprobado!: number;
  private liquidado!: number;

  constructor(private fb: FormBuilder, private secopService: SecopService, @Inject(LOCALE_ID) public locale: string, private modal: ModalService) {
    // this.fillChart();
    //   this.cleanChart();
    this.chartOptions = {
      series: [],
      chart: {},
      responsive: [],
      labels: []
    };
    // Create 100 users
    // const users = Array.from({length: 100}, (_, k) => createNewUser(k + 1));
    //
    // // Assign the data to the data source for the table to render
    // this.dataSource = new MatTableDataSource(users);
  }

  ngOnInit(): void {
    this.createForm();
    this.getcentroGestor();
  }

  ngAfterViewInit() {
    // this.dataSource.paginator = this.paginator;
    // this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  createForm() {
    this.reportesForm = this.fb.group({
      token: new FormControl(atob(localStorage.getItem('token')!)),
      username: new FormControl(atob(localStorage.getItem('username')!)),
      codigoEntidad: new FormControl(atob(localStorage.getItem('codigoEntidad')!)),
      centroGestor: new FormControl({value: '', disabled: false}),
      fechaInicio: new FormControl({value: null, disabled: false}),
      fechaTermino: new FormControl({value: null, disabled: false}),
      proceso: new FormControl({value: null, disabled: false}),
      estadoProceso: new FormControl({value: null, disabled: false}),
      creadorProceso: new FormControl({value: null, disabled: false}),
      fechaCreacion: new FormControl({value: null, disabled: false}),
      valorMinimo: new FormControl({value: null, disabled: false}),
      valorMaximo: new FormControl({value: null, disabled: false})
    });
  }

  goDetail(row: any) {
    this.secopService.getSelectedProcess(this.token, row.CONS_PROCESO).subscribe((response: any) => {
      localStorage.setItem('modalData', JSON.stringify(Object.assign({}, response.Values.ResultFields[0][0])));
      this.modal.sendClickEvent();
    });
  }

  searchReports() {
    // console.log(this.reportesForm);
    let username = this.reportesForm.controls['username'].value;
    let centroGestor = (this.ROL != '4') ? this.CENTROGESTOR : this.reportesForm.controls['centroGestor'].value;
    let result = moment().format().slice(0, -15);
    // let fechaInicio = (this.reportesForm.controls['fechaInicio'].value == null) ? result : moment(this.reportesForm.controls['fechaInicio'].value).format().slice(0, -15);
    // let fechaTermino = (this.reportesForm.controls['fechaTermino'].value == null) ? result : moment(this.reportesForm.controls['fechaTermino'].value).format().slice(0, -15);
    let fechaInicio = this.reportesForm.controls['fechaInicio'].value;
    let fechaTermino = this.reportesForm.controls['fechaTermino'].value;
    let proceso = this.reportesForm.controls['proceso'].value;
    let estadoProceso = this.reportesForm.controls['estadoProceso'].value;
    let creadorProceso = this.reportesForm.controls['creadorProceso'].value;
    let fechaCreacion = this.reportesForm.controls['fechaCreacion'].value;
    let valorMinimo = this.reportesForm.controls['valorMinimo'].value;
    let valorMaximo = this.reportesForm.controls['valorMaximo'].value;
    if (valorMinimo != null && valorMaximo == null) {
      utils.showAlert('Por favor ingrese un valor maximo', 'warning');
      return;
    } else if (valorMinimo == null && valorMaximo != null) {
      utils.showAlert('Por favor ingrese un valor minimo', 'warning');
      return;
    }
    this.secopService.getReportsData(fechaInicio, fechaTermino, this.ROL, centroGestor, username, proceso, estadoProceso, creadorProceso, fechaCreacion, valorMinimo, valorMaximo).subscribe((response: any) => {
      let creado = 0;
      let anulado = 0;
      let rechazado = 0;
      let pendiente = 0;
      let aprobado = 0;
      let liquidado = 0;
      if (response.Status == 'Ok') {
        this.RESPONSE = response.Values.ResultFields;
        this.RESPONSE.filter((element:any, index:any) => {
          if(element['ESTADO'] == 2){
            creado += 1;
          }
          if(element['ESTADO'] == 1){
            anulado += 1;
          }
          if(element['ESTADO'] == 0){
            rechazado += 1;
          }
          if(element['ESTADO'] == 7){
            aprobado += 1;
          }
          if(element['ESTADO'] == 8){
            liquidado += 1;
          }
          if(element['ESTADO'] > 2 && element['ESTADO'] < 7){
            pendiente += 1;
          }
        });
        // console.log('Creado - ',creado);
        // console.log('Anulado - ',anulado);
        // console.log('Rechazado - ',rechazado);
        // console.log('Aprobado - ',aprobado);
        // console.log('Liquidado - ',liquidado);
        //"Anulado", "Aprobado", "Creado", "Liquidado", "Pendiente"
        let dataGraph: any[] = [];
        dataGraph.push({Anulado:anulado});
        dataGraph.push({Aprobado:aprobado});
        dataGraph.push({Creado:creado});
        dataGraph.push({Liquidado:liquidado});
        dataGraph.push({Rechazado:rechazado});

        // console.log('total - ',dataGraph);
        this.fileName = 'Reporte_' + this.CENTROGESTOR + '_' + moment().format().slice(0, -6) + '.xlsx';
        // this.validateData();
        this.dataSource = new MatTableDataSource(this.RESPONSE);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.reporteActivo = true;
        this.fillChart(dataGraph);
      } else {
        this.cleanChart();
        utils.showAlert('No se encontraron registros!', 'warning')
        this.reporteActivo = false;
      }


    })
  }

  generateReports() {
    let fecha_generacion = 'Fecha Generación';
    let fecha_generacion_sin_acentos = fecha_generacion.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    let entidad = this.ENTIDAD;
    let CENTROGESTOR = this.CENTROGESTOR;
    if (this.RESPONSE == null || this.RESPONSE.length <= 0) {
      utils.showAlert('No se encontraron datos para la busqueda!', 'warning');
      return;
    }
    let data = this.fillContentReport(this.RESPONSE);
    let report: any = {
      pageMargins: [40, 120, 40, 40],
      footer: function (currentPage: any, pageCount: any) {
        return [
          {
            stack: [
              {text: '' + currentPage.toString() + ' of ' + pageCount, margin: [10, 10], fontSize: 10},
            ]
          }
        ]
      },
      header: function (currentPage: any, pageCount: any, pageSize: any) {
        return [
          {
            columns: [
              {
                image: 'data:image/png;base64,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',
                width: 310,
                height: 55,
                margin: [30, 40],
              },
              {
                qr: ' Fecha de generacion: ' + moment().format().slice(0, -6) + '\nCentro Gestor: ' + CENTROGESTOR,
                fit: '67',
                margin: [160, 30, 0, 50]
              },
              // { qr: [
              //     {image: 'sampleImage.jpg'}],
              // },
            ],
          }
        ]
      },
      content: [
        {
          stack: data,
          width: 500,
        },
      ],
      styles: {
        date: {
          color: '#000fff',
          border: [false, false, false, false],
        },
        header: {
          fontSize: 10,
          bold: true,
          alignment: 'center',
          margin: [60, 5, 60, 20]
        },
        texto: {
          fontSize: 10,
          bold: false,
          margin: [45, 0, 45, 0],
          alignment: 'justify'
        },
        texto1: {
          fontSize: 10,
          bold: false,
          margin: [45, 0, 45, 0],
          alignment: 'justify'
        },
        texto2: {
          fontSize: 7,
          italics: true,
          bold: false,
          margin: [60, 0, 60, 0],
          color: '#5e5e5e',
          alignment: 'justify'
        },
        table: {
          fontSize: 10
        },
        tableHeader: {
          fontSize: 10,
          bold: true
        },
        header1: {
          fontSize: 18,
          bold: true,
          alignment: 'right',
          margin: [0, 190, 0, 80],
        },
      },
    }
    pdfMake.createPdf(report).open();
  }

  getcentroGestor() {
    this.secopService.getDependenciasSecop(this.ENTIDAD, this.ROL).subscribe((response: any) => {
      this.gestor = response.Values.ResultFields;
    })
  }

  fillContentReport(response: any) {
    let body = [];
    let header = {
      text: 'Reporte Estandar ' +
        '\n' +
        '\n', alignment: 'center', bold: true, fontSize: 16
    };
    let estado;
    body.push(header);
    for (let i = 0; i < response.length; i++) {
      let text = [
        {
          style: 'table',
          table: {
            widths: [150, 350],
            heights: 20,
            body: [
              [{text: 'Centro gestor:', fillColor: '#eeeeee'}, {
                text: [{text: response[i].CENTRO_GESTOR + ' '},
                ],
              }],
              [{text: 'Nombre:', fillColor: '#eeeeee'}, {
                text: [{text: response[i].NOM_PROV + ' '},
                ],
              }],
              [{text: 'Número de documento:', fillColor: '#eeeeee'}, {
                text: [{text: response[i].COD_PROV + ' '},
                ],
              }],
              [{text: 'Tipo de documento:', fillColor: '#eeeeee'}, {
                text: [{text: response[i].TIP_IDEN_PROV + ' '},
                ],
              }],
              [{text: 'Género:', fillColor: '#eeeeee'}, {
                text: [{text: response[i].GENERO_PROV + ' '},
                ],
              }],
              [{text: 'Edad:', fillColor: '#eeeeee'}, {
                text: [{text: this.getEdad(response[i].NACIMIENTO_PROV) + ' '},
                ],
              }],
              [{text: 'Profesión:', fillColor: '#eeeeee'}, {
                text: [{text: response[i].PROFESION_PROV + ' '},
                ],
              }],
              [{text: 'Celular:', fillColor: '#eeeeee'}, {
                text: [{text: response[i].CELULAR_PROV + ' '},
                ],
              }],
              [{text: 'Email:', fillColor: '#eeeeee'}, {
                text: [{text: response[i].CORREO_PROV + ' '},
                ],
              }],
              [{text: 'Pais:', fillColor: '#eeeeee'}, {
                text: [{text: 'Colombia' + ' '},
                ],
              }],
              [{text: 'Departamento:', fillColor: '#eeeeee'}, {
                text: [{text: response[i].DPTO + ' '},
                ],
              }],
              [{text: 'Ciudad:', fillColor: '#eeeeee'}, {
                text: [{text: response[i].CIUDAD + ' '},
                ],
              }],
              [{text: 'Dirección:', fillColor: '#eeeeee'}, {
                text: [{text: response[i].UBICACION_PROV + ' '},
                ],
              }],
              [{text: 'Valor del contrato:', fillColor: '#eeeeee'}, {
                text: [{text: response[i].VAL_OFERTA + ' '},
                ],

              }],
              [{text: 'Plazo del contrato:', fillColor: '#eeeeee'}, {
                text: [{text: moment(response[i].PLAZO_EJECUCION).format().slice(0, -15) + ' '},
                ],
              }],
              [{text: 'Categoría de Contratación:', fillColor: '#eeeeee'}, {
                text: [{text: response[i].CATE_CONTRATACION + ' '},
                ],
              }],
              [{text: 'CDP:', fillColor: '#eeeeee'}, {
                text: [{text: response[i].CDP + ' '},
                ],
              }],
              [{text: 'RPC:', fillColor: '#eeeeee'}, {
                text: [{text: response[i].CODIGO_RPC + ' '},
                ],
              }],
              [{text: 'Estado de la contratación:', fillColor: '#eeeeee'}, {
                text: [{text: response[i].ESTADO1 + ' '},
                ],
              }],
              [{text: 'Cuotas canceladas:', fillColor: '#eeeeee'}, {
                text: [{text: ' '},
                ],
              }],
            ]
          },
          text: '', pageBreak: (i == response.length - 1) ? '' : 'after',
        },
      ];
      body.push(text);
    }
    return body;
  }

  getEdad(fecha: any) {
    let birthDate = moment(fecha).format().slice(0, -15);
    let years = moment().diff(birthDate, 'years', false);
    return years;
  }

  exportexcel(): void {
    /* table id is passed over here */
    let element = document.getElementById('excel-table');
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    /* save to file */
    XLSX.writeFile(wb, this.fileName);

  }

  validateData() {
    if (this.RESPONSE == null || this.RESPONSE.length <= 0) {
      utils.showAlert('No se encontraron datos para la busqueda!', 'warning');
      return;
    }
    Swal.fire({
      title: 'En que formato desea generar el Reporte?',
      showDenyButton: true,
      showCancelButton: false,
      showCloseButton: true,
      icon: 'question',
      confirmButtonText: 'Excel',
      confirmButtonColor: 'green',
      allowOutsideClick: false,
      denyButtonText: 'PDF',
      denyButtonColor: '#B01F00',
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        this.exportexcel();
        utils.showAlert('Formato generado en excel!', 'success');
      } else if (result.isDenied) {
        this.generateReports();
        utils.showAlert('Formato generado en pdf!', 'success');
      }
    })
  }

  fillChart(dataGraph:any[]){
    // console.log(Object.values(dataGraph[0]))
    this.chartOptions = {
      series: [Object.values(dataGraph[0])[0], Object.values(dataGraph[1])[0], Object.values(dataGraph[2])[0], Object.values(dataGraph[3])[0], Object.values(dataGraph[4])[0]],
      chart: {
        width: 380,
        type: "pie"
      },
      labels: [Object.keys(dataGraph[0]), Object.keys(dataGraph[1]), Object.keys(dataGraph[2]), Object.keys(dataGraph[3]), Object.keys(dataGraph[4])],
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: "bottom"
            }
          }
        }
      ]
    };
  }

  cleanChart(){
    this.chartOptions = {
      series: [],
      chart: {},
      responsive: [],
      labels: []
    };
  }

}
