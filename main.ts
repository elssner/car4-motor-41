radio.onReceivedNumber(function (receivedNumber) {
    btLaufzeit = input.runningTime()
    qwiicmotor.setReceivedNumber(receivedNumber)
    bit.comment("0 Motor 0..128..255")
    bit.comment("1 Servo 0..45..135")
    i2cSchleife(true, qwiicmotor.getReceivedNumber(NumberFormat.UInt8LE, qwiicmotor.eOffset.z0), qwiicmotor.getReceivedNumber(NumberFormat.UInt8LE, qwiicmotor.eOffset.z1))
})
function MotorSteuerung (pMotorPower: number) {
    if (!(btConnected)) {
        qwiicmotor.controlRegister(qwiicmotor.qwiicmotor_eADDR(qwiicmotor.eADDR.Motor_x5D), qwiicmotor.eControl.DRIVER_ENABLE, false)
        iMotor = 128
        qwiicmotor.writeRegister(qwiicmotor.qwiicmotor_eADDR(qwiicmotor.eADDR.Motor_x5D), qwiicmotor.qwiicmotor_eRegister(qwiicmotor.eRegister.MB_DRIVE), iMotor)
    } else if (iMotor != pMotorPower) {
        bit.comment("connected und nur wenn von Sender empfangener Wert geändert")
        iMotor = pMotorPower
        qwiicmotor.writeRegister(qwiicmotor.qwiicmotor_eADDR(qwiicmotor.eADDR.Motor_x5D), qwiicmotor.qwiicmotor_eRegister(qwiicmotor.eRegister.MB_DRIVE), iMotor)
        qwiicmotor.controlRegister(qwiicmotor.qwiicmotor_eADDR(qwiicmotor.eADDR.Motor_x5D), qwiicmotor.eControl.DRIVER_ENABLE, true)
    }
}
input.onButtonEvent(Button.A, input.buttonEventClick(), function () {
    basic.showNumber(Math.round(Math.map(255, 0, 255, 135, 45)))
})
function zeigeStatus () {
	
}
input.onButtonEvent(Button.B, input.buttonEventClick(), function () {
    pins.digitalWritePin(DigitalPin.P0, 0)
})
function i2cSchleife (bConnected: boolean, pMotor: number, pServo: number) {
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
    lcd16x2rgb.writeText(lcd16x2rgb.lcd16x2_eADDR(lcd16x2rgb.eADDR_LCD.LCD_16x2_x3E), 0, 0, 15, "" + Math.round(bit.measureInCentimeters(DigitalPin.C16)) + "-" + input.lightLevel())
    lcd16x2rgb.writeText(lcd16x2rgb.lcd16x2_eADDR(lcd16x2rgb.eADDR_LCD.LCD_16x2_x3E), 1, 0, 12, wattmeter.statuszeile(wattmeter.wattmeter_eADDR(wattmeter.eADDR.Watt_x45), wattmeter.eStatuszeile.v_mA))
}
function ServoSteuerung (pWinkel: number) {
    if (!(btConnected)) {
        bit.comment("Bluetooth unterbrochen")
        iServo = 90
    } else if (iServo != pWinkel) {
        bit.comment("connected und Wert geändert")
        iServo = pWinkel
        pins.servoWritePin(AnalogPin.C17, iServo + 6)
    }
    return iServo
}
let iServo = 0
let iMotor = 0
let btLaufzeit = 0
let btConnected = false
pins.digitalWritePin(DigitalPin.P0, 1)
lcd16x2rgb.initLCD(lcd16x2rgb.lcd16x2_eADDR(lcd16x2rgb.eADDR_LCD.LCD_16x2_x3E))
wattmeter.reset(wattmeter.wattmeter_eADDR(wattmeter.eADDR.Watt_x45))
qwiicmotor.init(qwiicmotor.qwiicmotor_eADDR(qwiicmotor.eADDR.Motor_x5D))
btConnected = false
btLaufzeit = input.runningTime()
radio.setGroup(240)
pins.servoWritePin(AnalogPin.C17, 96)
loops.everyInterval(500, function () {
    bit.comment("Überwachung Bluetooth")
    if (input.runningTime() - btLaufzeit < 1000) {
        bit.comment("Bluetooth ist verbunden: 'wenn Zahl empfangen' ruft i2cSchleife auf")
    } else if (input.runningTime() - btLaufzeit > 60000) {
        bit.comment("nach 1 Minute ohne Bluetooth Relais aus schalten")
        pins.digitalWritePin(DigitalPin.P0, 0)
    } else {
        bit.comment("zwischen 1 Sekunde und 1 Minute ohne Bluetooth: Standby und blau blinken")
        i2cSchleife(false, 128, 90)
        if (Math.trunc(input.runningTime() / 1000) % 2 == 1) {
            basic.setLedColor(0x0000ff)
        } else {
            basic.turnRgbLedOff()
        }
    }
})
