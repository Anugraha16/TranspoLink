import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TransportService } from '../../core/services/transport.service';
import { FleetResponse } from '../../core/models/transport.model';

@Component({
  selector: 'app-transport-fleet',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatSnackBarModule
  ],
  template: `
  <div class="fleet-page">

    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon"><mat-icon>directions_bus</mat-icon></div>
        <div>
          <h2>Fleet</h2>
          <p>Manage your vehicles and track their status</p>
        </div>
      </div>
      <button class="action-btn" (click)="showForm = !showForm">
        <mat-icon>add</mat-icon> Add Vehicle
      </button>
    </div>

    <!-- Filter chips -->
    <div class="mini-stats">
      <div class="mini-stat all"         [class.active-filter]="statusFilter==='ALL'"         (click)="statusFilter='ALL'">        <mat-icon>directions_bus</mat-icon><span>All {{ fleets.length }}</span></div>
      <div class="mini-stat available"   [class.active-filter]="statusFilter==='AVAILABLE'"   (click)="statusFilter='AVAILABLE'">  <mat-icon>check_circle</mat-icon><span>Available {{ countByStatus('AVAILABLE') }}</span></div>
      <div class="mini-stat in_service"  [class.active-filter]="statusFilter==='IN_SERVICE'"  (click)="statusFilter='IN_SERVICE'"> <mat-icon>directions_bus</mat-icon><span>In Service {{ countByStatus('IN_SERVICE') }}</span></div>
      <div class="mini-stat maintenance" [class.active-filter]="statusFilter==='MAINTENANCE'" (click)="statusFilter='MAINTENANCE'"><mat-icon>build</mat-icon><span>Maintenance {{ countByStatus('MAINTENANCE') }}</span></div>
      <div class="mini-stat retired"     [class.active-filter]="statusFilter==='RETIRED'"     (click)="statusFilter='RETIRED'">    <mat-icon>block</mat-icon><span>Retired {{ countByStatus('RETIRED') }}</span></div>
    </div>

    <!-- Add Vehicle Form -->
    <div class="form-panel" *ngIf="showForm">
      <div class="form-panel-header">
        <mat-icon>directions_bus</mat-icon>
        <h3>Add New Vehicle</h3>
        <button class="close-btn" (click)="showForm=false"><mat-icon>close</mat-icon></button>
      </div>
      <form [formGroup]="fleetForm" (ngSubmit)="addFleet()" class="panel-form">
        <mat-form-field appearance="outline" class="panel-field">
          <mat-label>Registration Number</mat-label>
          <input matInput formControlName="registrationNumber" placeholder="e.g. TN05KL2345" />
          <mat-icon matSuffix>badge</mat-icon>
        </mat-form-field>
        <mat-form-field appearance="outline" class="panel-field">
          <mat-label>Vehicle Type</mat-label>
          <input matInput formControlName="vehicleType" placeholder="e.g. Standard Bus" />
          <mat-icon matSuffix>commute</mat-icon>
        </mat-form-field>
        <mat-form-field appearance="outline" class="panel-field">
          <mat-label>Capacity</mat-label>
          <input matInput type="number" formControlName="capacity" placeholder="e.g. 50" />
          <mat-icon matSuffix>people</mat-icon>
        </mat-form-field>
        <div class="panel-actions">
          <button type="submit" class="submit-btn" [disabled]="fleetForm.invalid"><mat-icon>save</mat-icon> Save</button>
          <button type="button" class="cancel-btn" (click)="showForm=false">Cancel</button>
        </div>
      </form>
    </div>

    <!-- Content: list + side drawer -->
    <div class="content-layout" [class.drawer-open]="!!selectedFleet">

      <!-- Fleet List -->
      <div class="section-card">
        <div class="section-header">
          <h3><mat-icon>list</mat-icon> Vehicles ({{ filteredFleets.length }})</h3>
        </div>
        <div class="fleet-list" *ngIf="filteredFleets.length > 0">
          <div class="fleet-row" *ngFor="let f of filteredFleets"
            [class.selected]="selectedFleet?.fleetId === f.fleetId"
            (click)="selectFleet(f)">
            <div class="fleet-row-left">
              <div class="vehicle-icon"><mat-icon>directions_bus</mat-icon></div>
              <div class="fleet-info">
                <span class="vehicle-name">{{ f.vehicleType }}</span>
                <div style="display:flex;align-items:center;gap:8px;">
                  <span class="reg-badge">{{ f.registrationNumber }}</span>
                  <span class="capacity-badge"><mat-icon>people</mat-icon>{{ f.capacity }} passengers</span>
                </div>
              </div>
            </div>
            <div class="fleet-row-right">
              <span class="status-pill" [ngClass]="f.status.toLowerCase()">{{ f.status | titlecase }}</span>
              <mat-icon class="row-arrow">{{ selectedFleet?.fleetId === f.fleetId ? 'chevron_right' : 'chevron_right' }}</mat-icon>
            </div>
          </div>
        </div>
        <div class="empty-state" *ngIf="filteredFleets.length === 0">
          <mat-icon>directions_bus</mat-icon><p>No vehicles found</p>
        </div>
      </div>

      <!-- Side Drawer -->
      <div class="fleet-drawer" *ngIf="selectedFleet">
        <div class="drawer-header">
          <div class="drawer-title">
            <div class="vehicle-icon"><mat-icon>directions_bus</mat-icon></div>
            <div>
              <h3>{{ selectedFleet.vehicleType }}</h3>
              <span class="status-pill" [ngClass]="selectedFleet.status.toLowerCase()">{{ selectedFleet.status | titlecase }}</span>
            </div>
          </div>
          <button class="close-btn" (click)="selectedFleet=null"><mat-icon>close</mat-icon></button>
        </div>
        <div class="drawer-body">
          <div class="drawer-item">
            <span class="label">Registration Number</span>
            <span class="value">{{ selectedFleet.registrationNumber }}</span>
          </div>
          <div class="drawer-item">
            <span class="label">Vehicle Type</span>
            <span class="value">{{ selectedFleet.vehicleType }}</span>
          </div>
          <div class="drawer-item">
            <span class="label">Capacity</span>
            <span class="value">{{ selectedFleet.capacity }} passengers</span>
          </div>
          <div class="drawer-item">
            <span class="label">Current Status</span>
            <span class="status-pill" [ngClass]="selectedFleet.status.toLowerCase()">{{ selectedFleet.status | titlecase }}</span>
          </div>
          <div class="drawer-item update-section">
            <span class="label">Update Status</span>
            <mat-select class="status-select-lg" placeholder="Change status"
              (selectionChange)="updateFleetStatus(selectedFleet!.fleetId, $event.value)">
              <mat-option *ngFor="let s of fleetStatuses" [value]="s">{{ s | titlecase }}</mat-option>
            </mat-select>
          </div>
        </div>
      </div>

    </div>
  </div>
  `,
  styles: [`
    .fleet-page { display:flex; flex-direction:column; gap:20px; }

    /* Header */
    .page-header { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; background:linear-gradient(135deg,#0B2A35,#0D3D4A,#0F4D5C); border-radius:16px; padding:24px 28px; box-shadow:0 4px 24px rgba(13,148,136,0.18); }
    .header-left { display:flex; align-items:center; gap:16px; }
    .header-icon { width:52px; height:52px; border-radius:14px; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; }
    .header-icon mat-icon { font-size:28px; width:28px; height:28px; color:var(--color-primary); }
    h2 { font-size:22px; font-weight:700; color:white; margin:0 0 4px; }
    p { font-size:13px; color:rgba(255,255,255,0.65); margin:0; }
    .action-btn { display:flex; align-items:center; gap:8px; background:white; color:#0B2A35; border:none; border-radius:10px; padding:11px 20px; font-size:14px; font-weight:600; cursor:pointer; transition:all 0.2s; }
    .action-btn:hover { background:var(--color-primary-light); transform:translateY(-1px); }
    .action-btn mat-icon { font-size:20px; width:20px; height:20px; }

    /* Mini stats */
    .mini-stats { display:flex; gap:12px; flex-wrap:wrap; }
    .mini-stat { display:flex; align-items:center; gap:8px; padding:10px 18px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s; border:2px solid transparent; background:var(--bg-surface); color:var(--text-secondary); box-shadow:var(--shadow-sm); }
    .mini-stat mat-icon { font-size:18px; width:18px; height:18px; }
    .mini-stat:hover { transform:translateY(-1px); box-shadow:var(--shadow-md); }
    .mini-stat.all mat-icon         { color:var(--color-primary); }
    .mini-stat.available mat-icon   { color:var(--color-success); }
    .mini-stat.available            { color:var(--color-success); }
    .mini-stat.in_service mat-icon  { color:var(--color-primary); }
    .mini-stat.in_service           { color:var(--color-primary-dark); }
    .mini-stat.maintenance mat-icon { color:var(--color-secondary); }
    .mini-stat.maintenance          { color:var(--color-secondary-dark); }
    .mini-stat.retired mat-icon     { color:var(--color-danger); }
    .mini-stat.retired              { color:var(--color-danger); }
    .mini-stat.active-filter { border-color:var(--color-primary); box-shadow:0 4px 12px var(--color-primary-glow); transform:translateY(-2px); }

    /* Form panel */
    .form-panel { background:var(--bg-surface); border-radius:14px; border:1px solid var(--border-color); box-shadow:var(--shadow-md); overflow:hidden; }
    .form-panel-header { display:flex; align-items:center; gap:12px; padding:16px 20px; background:linear-gradient(135deg,#0B2A35,#0D3D4A); }
    .form-panel-header mat-icon { color:var(--color-primary); }
    .form-panel-header h3 { margin:0; font-size:16px; font-weight:600; color:white; flex:1; }
    .close-btn { background:rgba(255,255,255,0.12); border:none; border-radius:8px; color:white; cursor:pointer; padding:4px; display:flex; align-items:center; transition:background 0.2s; }
    .close-btn:hover { background:rgba(255,255,255,0.22); }
    .panel-form { display:flex; flex-wrap:wrap; gap:12px; align-items:flex-start; padding:20px; background:var(--bg-surface); }
    .panel-field { min-width:180px; flex:1; }
    .panel-actions { display:flex; gap:10px; align-items:center; padding-top:4px; }
    .submit-btn { display:flex; align-items:center; gap:8px; background:var(--color-primary); color:white; border:none; border-radius:10px; padding:12px 24px; font-size:14px; font-weight:600; cursor:pointer; transition:all 0.2s; box-shadow:0 4px 12px var(--color-primary-glow); }
    .submit-btn:hover:not(:disabled) { opacity:0.9; transform:translateY(-1px); }
    .submit-btn:disabled { opacity:0.45; cursor:not-allowed; }
    .cancel-btn { background:none; border:1.5px solid var(--border-color); border-radius:10px; padding:12px 20px; font-size:14px; color:var(--text-muted); cursor:pointer; transition:all 0.2s; }
    .cancel-btn:hover { background:var(--bg-muted); color:var(--text-primary); }

    /* Content layout */
    .content-layout { display:grid; grid-template-columns:1fr; gap:16px; transition:grid-template-columns 0.3s ease; }
    .content-layout.drawer-open { grid-template-columns:1fr 340px; }

    /* Section card */
    .section-card { background:var(--bg-surface); border-radius:14px; border:1px solid var(--border-subtle); box-shadow:var(--shadow-sm); overflow:hidden; }
    .section-header { display:flex; align-items:center; padding:16px 20px; border-bottom:1px solid var(--border-subtle); background:var(--bg-muted); }
    .section-header h3 { display:flex; align-items:center; gap:8px; margin:0; font-size:15px; font-weight:600; color:var(--text-primary); }
    .section-header h3 mat-icon { font-size:20px; width:20px; height:20px; color:var(--color-primary); }

    /* Fleet rows */
    .fleet-list { display:flex; flex-direction:column; }
    .fleet-row { display:flex; align-items:center; justify-content:space-between; gap:14px; padding:14px 20px; border-bottom:1px solid var(--border-subtle); cursor:pointer; transition:background 0.15s; }
    .fleet-row:last-child { border-bottom:none; }
    .fleet-row:hover { background:var(--bg-muted); }
    .fleet-row.selected { background:var(--color-primary-light); border-left:3px solid var(--color-primary); }
    .fleet-row-left { display:flex; align-items:center; gap:14px; flex:1; min-width:0; }
    .vehicle-icon { width:42px; height:42px; border-radius:12px; background:linear-gradient(135deg,#0B2A35,var(--color-primary)); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .vehicle-icon mat-icon { font-size:22px; width:22px; height:22px; color:white; }
    .fleet-info { display:flex; flex-direction:column; gap:4px; min-width:0; }
    .vehicle-name { font-size:14px; font-weight:700; color:var(--text-primary); }
    .reg-badge { background:var(--color-primary-light); color:var(--color-primary-dark); padding:2px 8px; border-radius:6px; font-size:11px; font-weight:700; font-family:monospace; }
    .capacity-badge { display:flex; align-items:center; gap:3px; font-size:12px; color:var(--color-primary); font-weight:600; }
    .capacity-badge mat-icon { font-size:14px; width:14px; height:14px; }
    .fleet-row-right { display:flex; align-items:center; gap:8px; flex-shrink:0; }
    .row-arrow { font-size:18px; width:18px; height:18px; color:var(--color-primary); transition:transform 0.2s; }
    .fleet-row.selected .row-arrow { transform:rotate(90deg); }

    /* Status pills */
    .status-pill { padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600; display:inline-block; white-space:nowrap; }
    .status-pill.available   { background:rgba(16,185,129,0.12); color:var(--color-success); }
    .status-pill.in_service  { background:var(--color-primary-light); color:var(--color-primary-dark); }
    .status-pill.maintenance { background:rgba(245,158,11,0.12); color:var(--color-secondary-dark); }
    .status-pill.retired     { background:rgba(239,68,68,0.12); color:var(--color-danger); }

    /* Side drawer */
    .fleet-drawer { background:var(--bg-surface); border-radius:14px; border:1px solid var(--border-subtle); box-shadow:var(--shadow-sm); overflow:hidden; display:flex; flex-direction:column; align-self:start; }
    .drawer-header { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:16px 20px; background:linear-gradient(135deg,#0B2A35,#0D3D4A); }
    .drawer-title { display:flex; align-items:center; gap:12px; }
    .drawer-title h3 { margin:0 0 6px; font-size:14px; font-weight:700; color:white; }
    .drawer-body { display:flex; flex-direction:column; }
    .drawer-item { display:flex; flex-direction:column; gap:5px; padding:14px 20px; border-bottom:1px solid var(--border-subtle); }
    .drawer-item:last-child { border-bottom:none; }
    .label { font-size:11px; color:var(--color-primary); font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }
    .value { font-size:14px; font-weight:600; color:var(--text-primary); }
    ::ng-deep .status-select-lg .mat-mdc-select-value,
    ::ng-deep .status-select-lg .mat-mdc-select-value-text,
    ::ng-deep .status-select-lg .mat-mdc-select-placeholder,
    ::ng-deep .status-select-lg .mat-mdc-select-arrow { color: var(--text-primary) !important; }
    ::ng-deep .status-select-lg .mat-mdc-select-trigger { background: transparent !important; }

    /* Empty state */
    .empty-state { display:flex; flex-direction:column; align-items:center; gap:12px; padding:48px; }
    .empty-state mat-icon { font-size:52px; width:52px; height:52px; color:var(--color-primary); opacity:0.35; }
    .empty-state p { font-size:15px; color:var(--text-muted); margin:0; }
  `]
})
export class TransportFleetComponent implements OnInit {
  fleets: FleetResponse[] = [];
  availableFleets: FleetResponse[] = [];
  selectedFleet: FleetResponse | null = null;
  showForm = false;
  statusFilter = 'ALL';
  fleetStatuses = ['AVAILABLE', 'IN_SERVICE', 'MAINTENANCE', 'RETIRED'];

  get filteredFleets(): FleetResponse[] {
    return this.statusFilter === 'ALL' ? this.fleets : this.fleets.filter(f => f.status === this.statusFilter);
  }

  fleetForm = this.fb.group({
    registrationNumber: ['', Validators.required],
    vehicleType: ['', Validators.required],
    capacity:    [null as number | null, [Validators.required, Validators.min(1)]]
  });

  constructor(private transportService: TransportService, private fb: FormBuilder, private snack: MatSnackBar) {}

  ngOnInit(): void {
    this.loadFleet();
    this.transportService.getAvailableFleet().subscribe(d => this.availableFleets = d);
  }

  onRegistrationSelect(regNum: string): void {
    const fleet = this.availableFleets.find(f => f.registrationNumber === regNum);
    if (fleet) this.fleetForm.patchValue({ vehicleType: fleet.vehicleType, capacity: fleet.capacity });
  }

  loadFleet(): void {
    this.transportService.getAllFleet().subscribe({
      next: d => this.fleets = d,
      error: () => this.snack.open('Failed to load fleet', 'OK', { duration: 3000 })
    });
  }

  selectFleet(f: FleetResponse): void {
    this.selectedFleet = this.selectedFleet?.fleetId === f.fleetId ? null : f;
  }

  countByStatus(s: string): number { return this.fleets.filter(f => f.status === s).length; }

  addFleet(): void {
    if (this.fleetForm.invalid) return;
    const { registrationNumber, vehicleType, capacity } = this.fleetForm.value;
    this.transportService.addFleet({ registrationNumber: registrationNumber!, vehicleType: vehicleType!, capacity: capacity! }).subscribe({
      next: () => { this.loadFleet(); this.fleetForm.reset(); this.showForm = false; this.snack.open('Vehicle added', 'OK', { duration: 3000 }); }
    });
  }

  updateFleetStatus(id: number, status: string): void {
    this.transportService.updateFleetStatus(id, status).subscribe({
      next: () => {
        this.loadFleet();
        if (this.selectedFleet) this.selectedFleet = { ...this.selectedFleet, status: status as any };
        this.snack.open('Status updated', 'OK', { duration: 2000 });
      }
    });
  }
}
