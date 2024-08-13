
import St from 'gi://St';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

export default class DayCounterExtension extends Extension {
    _indicators = {};
    _signalHandler = null;
    _settings = null;

    enable() {
        this._settings = this.getSettings();
        let myArray = this._settings.get_strv('counter-list');

        this._updateIndicators(myArray);

        this._signalHandler = this._settings.connect("changed", (setting,key) => {
            if (key === "counter-list" | key === "indicator-position" | key === "indicator-index"){
                const arr = setting.get_strv('counter-list');
                this._removeIndicator();
                this._updateIndicators(arr);
            }
        })
    }

    disable() {
        if (this._settings !== null && this._signalHandler !== null) {
            this._settings.disconnect(this._signalHandler);
          }
        for(let id in this._indicators) {
            this._indicators[id].indicator.destroy();
            GLib.source_remove(this._indicators[id].timeoutId);
            // delete this._indicators[id];
        };

        this._signalHandler = null;
        this._settings = null;
        this._indicators = {};
    }


    // Update and Add Indicator to StatusBar
    _updateIndicators(myArray) {

        if(Object.keys(this._indicators).length !== 0){
            for(let id in this._indicators) {
                if (!myArray.includes(id)) {
                    this._indicators[id].indicator.destroy();
                    GLib.source_remove(this._indicators[id].timeoutId);
                }
            };
        }
        
        

        myArray.forEach(item => {
            const val = item.split(',');

            if (!this._indicators.hasOwnProperty(val[0])) {

                this._indicators[val[0]] = {};
                const indicator = new PanelMenu.Button(0.0, item, false);
                let hbox = new St.BoxLayout({style_class: 'panel-status-menu-box' });
                let icon = new St.Icon({icon_name: val[2], style_class: 'system-status-icon'});
                let label = new St.Label({y_align: Clutter.ActorAlign.CENTER, text: this._getDays(val[4], val[5], val[6], val[3])});

                hbox.add_child(icon);
                hbox.add_child(label);
                indicator.add_child(hbox);
                
                Main.panel.addToStatusArea(
                    this.uuid + val[0],
                    indicator,
                    this._settings.get_int("indicator-index"),
                    this._settings.get_string("indicator-position")
                );

                const timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
                    this._updateLabels(label, val[0], val[4], val[5], val[6], val[3]);
                    return GLib.SOURCE_CONTINUE;
                });

                this._indicators[val[0]] = { indicator, label, timeoutId };

            }
        });
    }


    // Update the Lable at the Status bar
    _updateLabels(label, ind, year, month, day, countType) {
        
        if (this._indicators.hasOwnProperty(ind))
            label.set_text(this._getDays(year, month, day, countType))
    }

    _removeIndicator() {
        for(let id in this._indicators) {
            this._indicators[id].indicator.destroy();
            GLib.source_remove(this._indicators[id].timeoutId);
            // delete this._indicators[id];
        };

        this._indicators = {};
    }


    // Get the Date from user and return number of days from today
    _getDays(year, month, day, countType) {
        const targetDate = GLib.DateTime.new_local(year, month, day, 0, 0, 0); // Replace with your target year, month, day
        const nowDate = GLib.DateTime.new_now_local();
        let microsecond = 0;

        if(countType == 'U'){
            microsecond = nowDate.difference(targetDate);
        }
        else{
            microsecond = targetDate.difference(nowDate);
        }
    
        // const microsecond = Math.abs(targetDate.difference(nowDate));
        const days = Math.floor(microsecond/864e8);

        return `${days} Days`;
    }
}
