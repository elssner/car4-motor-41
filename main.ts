radio.onReceivedNumber(function (receivedNumber) {
    btLaufzeit = input.runningTime()
    qwiicmotor.setReceivedNumber(receivedNumber)
    if (!(btConnected) && (qwiicmotor.getReceivedNumber(NumberFormat.UInt8LE, qwiicmotor.eOffset.z0) == 128 && qwiicmotor.getReceivedNumber(NumberFormat.UInt8LE, qwiicmotor.eOffset.z1) == 90)) {
        bit.comment("einmalig nach neu connected")
        btConnected = true
        qwiicmotor.controlRegister(qwiicmotor.qwiicmotor_eADDR(qwiicmotor.eADDR.Motor_x5D), qwiicmotor.eControl.DRIVER_ENABLE, true)
        pins.digitalWritePin(DigitalPin.P1, 1)
        basic.setLedColor(0x00ff00)
    } else if (btConnected) {
        bit.comment("dauerhaft wenn connected")
        bit.comment("1 Servo 0..45..135")
        if (ServoSteuerung(qwiicmotor.getReceivedNumber(NumberFormat.UInt8LE, qwiicmotor.eOffset.z1))) {
            bit.comment("0 Motor 0..128..255")
            MotorSteuerung(qwiicmotor.getReceivedNumber(NumberFormat.UInt8LE, qwiicmotor.eOffset.z0))
        } else {
            bit.comment("wenn Servo Winkel ungültig -> Motor Stop")
            MotorSteuerung(128)
        }
        zeigeStatus()
    }
})
function MotorSteuerung (pMotorPower: number) {
    if (iMotor != pMotorPower) {
        bit.comment("connected und nur wenn von Sender empfangener Wert geändert")
        iMotor = pMotorPower
        qwiicmotor.writeRegister(qwiicmotor.qwiicmotor_eADDR(qwiicmotor.eADDR.Motor_x5D), qwiicmotor.qwiicmotor_eRegister(qwiicmotor.eRegister.MB_DRIVE), iMotor)
    }
}
function nichts1 () {
    bit.comment("Überwachung Bluetooth")
    if (input.runningTime() - btLaufzeit < 1000) {
        bit.comment("Bluetooth ist verbunden: 'wenn Zahl empfangen' ruft i2cSchleife auf")
    } else if (input.runningTime() - btLaufzeit > 60000) {
        bit.comment("nach 1 Minute ohne Bluetooth Relais aus schalten")
        pins.digitalWritePin(DigitalPin.P0, 0)
    } else {
        bit.comment("zwischen 1 Sekunde und 1 Minute ohne Bluetooth: Standby und blau blinken")
        if (Math.trunc(input.runningTime() / 1000) % 2 == 1) {
            basic.setLedColor(0x0000ff)
        } else {
            basic.turnRgbLedOff()
        }
    }
}
pins.onPulsed(DigitalPin.P3, PulseValue.Low, function () {
    if (iMotor >= 128) {
        iEncoder += 1
    } else {
        iEncoder += -1
    }
})
function zeigeStatus () {
    lcd16x2rgb.writeText(lcd16x2rgb.lcd16x2_eADDR(lcd16x2rgb.eADDR_LCD.LCD_16x2_x3E), 0, 0, 15, iEncoder, lcd16x2rgb.eAlign.right)
    lcd16x2rgb.writeText(lcd16x2rgb.lcd16x2_eADDR(lcd16x2rgb.eADDR_LCD.LCD_16x2_x3E), 1, 8, 15, "" + bit.formatText(convertToText(bit.roundWithPrecision(wattmeter.get_bus_voltage_V(wattmeter.wattmeter_eADDR(wattmeter.eADDR.Watt_x45)), 1)), 3, bit.eAlign.right) + "V" + bit.formatText(convertToText(wattmeter.get_current_mA(wattmeter.wattmeter_eADDR(wattmeter.eADDR.Watt_x45))), 4, bit.eAlign.right))
}
input.onButtonEvent(Button.B, input.buttonEventClick(), function () {
    pins.digitalWritePin(DigitalPin.P0, 0)
})
function nichts2 (bConnected: boolean, pMotor: number, pServo: number) {
    if (bConnected && !(btConnected)) {
        bit.comment("einmalig nach neu connected")
        btConnected = true
        qwiicmotor.controlRegister(qwiicmotor.qwiicmotor_eADDR(qwiicmotor.eADDR.Motor_x5D), qwiicmotor.eControl.DRIVER_ENABLE, true)
        basic.setLedColor(0x00ff00)
    } else if (btConnected && !(bConnected)) {
        bit.comment("einmalig nach neu disconnected")
        btConnected = false
        qwiicmotor.controlRegister(qwiicmotor.qwiicmotor_eADDR(qwiicmotor.eADDR.Motor_x5D), qwiicmotor.eControl.DRIVER_ENABLE, false)
        iMotor = 128
        iServo = 90
    }
    if (btConnected) {
        bit.comment("dauerhaft wenn connected")
        if (iMotor != pMotor) {
            iMotor = pMotor
            qwiicmotor.writeRegister(qwiicmotor.qwiicmotor_eADDR(qwiicmotor.eADDR.Motor_x5D), qwiicmotor.qwiicmotor_eRegister(qwiicmotor.eRegister.MB_DRIVE), iMotor)
        }
        if (iServo != pServo) {
            iServo = pServo
            pins.servoWritePin(AnalogPin.C17, iServo + 6)
        }
    } else {
        bit.comment("dauerhaft wenn disconnected")
    }
}
function Konfiguration () {
    bit.comment("P0 Grove Relay; P1 RB LED (DRIVER_ENABLE)")
    bit.comment("P2 frei; P3 Encoder")
    bit.comment("P16 Ultraschall; P17 Servo")
    bit.comment("5 Erweiterungen: Funk; BIT; LCD 16x2; Motor; Wattmeter")
}
function ServoSteuerung (pWinkel: number) {
    if (!(bit.between(pWinkel, 45, 135))) {
        return false
    } else if (iServo != pWinkel) {
        bit.comment("connected und Wert geändert")
        iServo = pWinkel
        pins.servoWritePin(AnalogPin.C17, iServo + 6)
        return true
    } else {
        return true
    }
}
let iServo = 0
let iEncoder = 0
let iMotor = 0
let btLaufzeit = 0
let btConnected = false
pins.digitalWritePin(DigitalPin.P0, 1)
lcd16x2rgb.initLCD(lcd16x2rgb.lcd16x2_eADDR(lcd16x2rgb.eADDR_LCD.LCD_16x2_x3E))
wattmeter.reset(wattmeter.wattmeter_eADDR(wattmeter.eADDR.Watt_x45))
lcd16x2rgb.writeText(lcd16x2rgb.lcd16x2_eADDR(lcd16x2rgb.eADDR_LCD.LCD_16x2_x3E), 1, 8, 15, wattmeter.get_bus_voltage_V(wattmeter.wattmeter_eADDR(wattmeter.eADDR.Watt_x45)))
qwiicmotor.init(qwiicmotor.qwiicmotor_eADDR(qwiicmotor.eADDR.Motor_x5D))
btConnected = false
btLaufzeit = input.runningTime()
radio.setGroup(240)
pins.servoWritePin(AnalogPin.C17, 96)
pins.setPull(DigitalPin.P3, PinPullMode.PullUp)
loops.everyInterval(500, function () {
    bit.comment("Überwachung Bluetooth")
    if (input.runningTime() - btLaufzeit > 60000) {
        bit.comment("nach 1 Minute ohne Bluetooth Relais aus schalten")
        pins.digitalWritePin(DigitalPin.P0, 0)
    } else if (btConnected && input.runningTime() - btLaufzeit > 1000) {
        bit.comment("zwischen 1 Sekunde und 1 Minute ohne Bluetooth: Standby und blau blinken")
        bit.comment("einmalig nach neu disconnected")
        btConnected = false
        qwiicmotor.controlRegister(qwiicmotor.qwiicmotor_eADDR(qwiicmotor.eADDR.Motor_x5D), qwiicmotor.eControl.DRIVER_ENABLE, false)
        pins.digitalWritePin(DigitalPin.P1, 0)
    } else if (!(btConnected)) {
        bit.comment("dauerhaft wenn disconnected")
        zeigeStatus()
        if (Math.trunc(input.runningTime() / 1000) % 2 == 1) {
            basic.setLedColor(0x0000ff)
        } else {
            basic.turnRgbLedOff()
        }
    } else {
        bit.comment("Bluetooth ist verbunden: 'wenn Zahl empfangen' ruft i2cSchleife auf")
    }
})
