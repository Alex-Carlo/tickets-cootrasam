import { Component, OnInit, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SyncService } from './core/services/sync.service';
import { TokenRefreshService } from './core/services/token-refresh.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private syncService = inject(SyncService);
  private tokenRefresh = inject(TokenRefreshService);

  ngOnInit(): void {
    this.syncService.startAutoSync();
  }
}
