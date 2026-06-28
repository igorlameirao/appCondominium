import 'package:flutter/material.dart';
import 'package:pie_chart/pie_chart.dart';

Widget graficoPizza(BuildContext context) {
  List<Color> colorList = [
    const Color(0xffF08784),
    const Color(0xffff0000),
    const Color(0xff774342),
    const Color(0xff3A0603),
    const Color(0xffff8352),
    const Color(0xffffc800),
    const Color(0xffFFF200),
    const Color(0xffebff36),
    const Color(0xffbaff75),
    const Color(0xffB5E61D),
    const Color(0xff08ff00),
    const Color(0xff20ff20),
    const Color(0xff00ffc8),
    const Color(0xff73d0ff),
    const Color(0xff0000ff),
    const Color(0xff00129A),
    const Color(0xff000C7B),
    const Color(0xff732BF5),
    const Color(0xffFF00FF),
    const Color(0xffff75ef),
    const Color(0xffF5F5F5),
    const Color(0xffFFF9D7),
    const Color(0xff000000),
    const Color(0xffffffff)
  ];
  Map<String, double> dataMap = {
    "Manutenção e Limpeza": 3293.03,
    "Troca Extintores": 6245.65,
    "Reforma São de Festas": 5600.00,
    "Funcionalismo": 35246.20,
  };
  return PieChart(
    dataMap: dataMap,
    animationDuration: const Duration(milliseconds: 800),
    chartLegendSpacing: 32,
    chartRadius: MediaQuery.of(context).size.width / 3.2,
    colorList: colorList,
    initialAngleInDegree: 0,
    chartType: ChartType.ring,
    ringStrokeWidth: 32,
    centerText: "HYBRID",
    legendOptions: const LegendOptions(
      showLegendsInRow: false,
      legendPosition: LegendPosition.right,
      showLegends: true,
      legendShape: BoxShape.circle,
      legendTextStyle: TextStyle(
        fontWeight: FontWeight.bold,
      ),
    ),
    chartValuesOptions: const ChartValuesOptions(
      showChartValueBackground: true,
      showChartValues: true,
      showChartValuesInPercentage: false,
      showChartValuesOutside: false,
      decimalPlaces: 1,
    ),
    // gradientList: ---To add gradient colors---
    // emptyColorGradient: ---Empty Color gradient---
  );
}
