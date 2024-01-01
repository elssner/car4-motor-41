radio.onReceivedNumber(function (receivedNumber) {
    btLaufzeit = input.runningTime()
    qwiicmotor.setReceivedNumber(receivedNumber)
    if (!(btConnected) && true) {
        bit.comment("einmalig nach neu connected")
        btConnected = true
        qwiicmotor.controlRegister(qwiicmotor.qwiicmotor_eADDR(qwiicmotor.eADDR.Motor_x5D), qwiicmotor.eControl.DRIVER_ENABLE, true)
        bLicht = !(bLicht)
    } else if (btConnected) {
        if (iFahrstrecke == 0) {
            bit.comment("dauerhaft wenn connected (Joystick, nicht bei Fahrstrecke)")
            bit.comment("1 Servo 45..90..135")
            if (ServoSteuerung(qwiicmotor.getReceivedNumber(NumberFormat.UInt8LE, qwiicmotor.eOffset.z1))) {
                bit.comment("0 Motor 0..128..255")
                MotorSteuerung(qwiicmotor.getReceivedNumber(NumberFormat.UInt8LE, qwiicmotor.eOffset.z0), qwiicmotor.getReceivedNumber(NumberFormat.UInt8LE, qwiicmotor.eOffset.z2))
            } else {
                bit.comment("wenn Servo Winkel ungültig -> Motor Stop")
                MotorSteuerung(128, 0)
            }
        } else if (qwiicmotor.getReceivedNumber(NumberFormat.UInt8LE, qwiicmotor.eOffset.z2) == 0) {
            bit.comment("iFahrstrecke erst zurück setzen, wenn 0 empfangen wurde")
            iFahrstrecke = 0
        }
        zeigeStatus()
    }
})
function MotorSteuerung (pMotorPower: number, pFahrstrecke: number) {
    if (iFahrstrecke == 0 && pFahrstrecke != 0) {
        bit.comment("Start Anzahl Impulse vom Encoder fahren")
        iFahrstrecke = pFahrstrecke
        iEncoder = 0
        iMotor = pMotorPower
        qwiicmotor.writeRegister(qwiicmotor.qwiicmotor_eADDR(qwiicmotor.eADDR.Motor_x5D), qwiicmotor.qwiicmotor_eRegister(qwiicmotor.eRegister.MA_DRIVE), iMotor)
        bit.comment("Motor Stop im Impuls-Zähler")
    } else if (iMotor != pMotorPower) {
        bit.comment("connected und nur wenn von Sender empfangener Wert geändert")
        iMotor = pMotorPower
        qwiicmotor.writeRegister(qwiicmotor.qwiicmotor_eADDR(qwiicmotor.eADDR.Motor_x5D), qwiicmotor.qwiicmotor_eRegister(qwiicmotor.eRegister.MA_DRIVE), iMotor)
    }
}
function zeigeStatus () {
    lcd16x2rgb.writeText(lcd16x2rgb.lcd16x2_eADDR(lcd16x2rgb.eADDR_LCD.LCD_16x2_x3E), 0, 0, 15, lcd16x2rgb.lcd16x2_text("" + bit.formatText(iMotor, 3, bit.eAlign.right) + bit.formatText(iServo, 4, bit.eAlign.right) + bit.formatText(iFahrstrecke, 4, bit.eAlign.right) + bit.formatText(iEncoder, 5, bit.eAlign.right)))
    lcd16x2rgb.writeText(lcd16x2rgb.lcd16x2_eADDR(lcd16x2rgb.eADDR_LCD.LCD_16x2_x3E), 1, 0, 7, "" + bit.formatText(Math.round(bit.measureInCentimeters(DigitalPin.C8)), 3, bit.eAlign.right) + bit.formatText(Helligkeit(pins.analogReadPin(AnalogPin.P1)), 4, bit.eAlign.right))
    lcd16x2rgb.writeText(lcd16x2rgb.lcd16x2_eADDR(lcd16x2rgb.eADDR_LCD.LCD_16x2_x3E), 1, 8, 15, "" + bit.formatText(bit.roundWithPrecision(wattmeter.get_bus_voltage_V(wattmeter.wattmeter_eADDR(wattmeter.eADDR.Watt_x45)), 1), 3, bit.eAlign.right) + "V" + bit.formatText(wattmeter.get_current_mA(wattmeter.wattmeter_eADDR(wattmeter.eADDR.Watt_x45)), 4, bit.eAlign.right))
}
input.onButtonEvent(Button.B, input.buttonEventClick(), function () {
    pins.digitalWritePin(DigitalPin.P0, 0)
})
pins.onPulsed(DigitalPin.P2, PulseValue.Low, function () {
    bit.comment("Encoder 63.3 Impulse pro U/Motorwelle")
    if (iMotor >= 128) {
        iEncoder += 1
    } else {
        iEncoder += -1
    }
    bit.comment("63.3 Motorwelle * (26/14) Zahnräder / (8 * PI) Rad Umfang = 4.6774502 || Test: 946 Impulse = 200 cm")
    if (iFahrstrecke != 0 && Math.abs(iEncoder) >= iFahrstrecke * 4.73) {
        MotorSteuerung(128, 0)
    }
})
function Helligkeit (pHelligkeit: number) {
    if (bLicht && pHelligkeit >= 300) {
        bLicht = false
        pins.digitalWritePin(DigitalPin.C7, 0)
    } else if (!(bLicht) && pHelligkeit < 200) {
        bLicht = true
        pins.digitalWritePin(DigitalPin.C7, 1)
    }
    return pHelligkeit
}
function Konfiguration () {
    bit.comment("P0 Grove Relay; P1 Fototransistor")
    bit.comment("P2 Encoder; P3 Buzzer")
    bit.comment("P4 Servo; ")
    bit.comment("P5 Draht blau; P6 Draht gelb")
    bit.comment("P7 Licht; P8 Ultraschall")
    bit.comment("5 Erweiterungen: Funk; BIT; LCD 16x2; Motor; Wattmeter")
}
function ServoSteuerung (pWinkel: number) {
    if (!(bit.between(pWinkel, 45, 135))) {
        return false
    } else if (iServo != pWinkel) {
        bit.comment("connected und Wert geändert")
        iServo = pWinkel
        pins.servoWritePin(AnalogPin.C4, iServo + 8)
        return true
    } else {
        return true
    }
}
let iServo = 0
let iEncoder = 0
let iMotor = 0
let bLicht = false
let iFahrstrecke = 0
let btLaufzeit = 0
let btConnected = false
pins.digitalWritePin(DigitalPin.P0, 1)
lcd16x2rgb.initLCD(lcd16x2rgb.lcd16x2_eADDR(lcd16x2rgb.eADDR_LCD.LCD_16x2_x3E))
lcd16x2rgb.writeText(lcd16x2rgb.lcd16x2_eADDR(lcd16x2rgb.eADDR_LCD.LCD_16x2_x3E), 0, 0, 15, lcd16x2rgb.lcd16x2_text("CaR 4-41"))
wattmeter.reset(wattmeter.wattmeter_eADDR(wattmeter.eADDR.Watt_x45))
qwiicmotor.init(qwiicmotor.qwiicmotor_eADDR(qwiicmotor.eADDR.Motor_x5D))
btConnected = false
btLaufzeit = input.runningTime()
iFahrstrecke = 0
radio.setGroup(240)
led.enable(false)
pins.servoWritePin(AnalogPin.C4, 96)
pins.setPull(DigitalPin.P2, PinPullMode.PullUp)
loops.everyInterval(1000, function () {
    bit.comment("Überwachung Bluetooth")
    if (input.runningTime() - btLaufzeit > 60000) {
        bit.comment("nach 1 Minute ohne Bluetooth Relais aus schalten")
        pins.digitalWritePin(DigitalPin.P0, 0)
    } else if (btConnected && input.runningTime() - btLaufzeit > 1000) {
        bit.comment("zwischen 1 Sekunde und 1 Minute ohne Bluetooth: Standby und blau blinken")
        bit.comment("einmalig nach neu disconnected")
        btConnected = false
        qwiicmotor.controlRegister(qwiicmotor.qwiicmotor_eADDR(qwiicmotor.eADDR.Motor_x5D), qwiicmotor.eControl.DRIVER_ENABLE, false)
    } else if (!(btConnected)) {
        bit.comment("dauerhaft wenn disconnected")
        zeigeStatus()
        if (Math.trunc(input.runningTime() / 1000) % 2 == 1) {
            pins.digitalWritePin(DigitalPin.C7, 0)
        } else {
            pins.digitalWritePin(DigitalPin.C7, 1)
        }
    } else {
        bit.comment("Bluetooth ist verbunden: 'wenn Zahl empfangen' ist aktiv")
    }
})
