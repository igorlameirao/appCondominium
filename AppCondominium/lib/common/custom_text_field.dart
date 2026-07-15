import 'package:flutter/material.dart';

// ignore: must_be_immutable
class CustomTextField extends StatefulWidget {
  final BuildContext context;
  final String labelText;

  final TextEditingController? controller;
  final int maxLength;
  int maxLines = 1;
  bool isMandatory = true;
  final TextInputType? keyboardType;
  final IconData? prefixIcon;
  final IconData? suffixIcon;
  final Function(String)? onFieldSubmitted;
  final Function(String?, String?)? validator;
  final Function(String)? onChanged;
  final EdgeInsetsGeometry? margin;
  final EdgeInsetsGeometry? padding;
  CustomTextField(this.context, this.labelText,
      {this.controller,
      this.margin,
      this.padding,
      this.maxLength = 255,
      this.maxLines = 1,
      this.isMandatory = true,
      this.keyboardType,
      this.prefixIcon,
      this.suffixIcon,
      this.onChanged,
      this.onFieldSubmitted,
      this.validator,
      Key? key})
      : super(key: key);
  @override
  // ignore: library_private_types_in_public_api
  _CustomTextFieldState createState() => _CustomTextFieldState();
}

class _CustomTextFieldState extends State<CustomTextField> {
  bool isEyesOpen = false;
  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
        margin: widget.margin,
        padding: widget.padding,
        child: TextFormField(
            controller: widget.controller,
            maxLength: widget.maxLength,
            maxLines: widget.maxLines,
            obscureText: widget.keyboardType == TextInputType.visiblePassword &&
                !isEyesOpen,
            decoration: InputDecoration(
                filled: true,
                fillColor: (Theme.of(context).dialogTheme.backgroundColor ??
                        Theme.of(context).colorScheme.surface)
                    .withAlpha(128),
                counterText: "",
                prefix:
                    widget.prefixIcon != null ? Icon(widget.prefixIcon) : null,
                suffixIcon: montarIcone(widget.keyboardType),
                border: const UnderlineInputBorder(
                    borderSide: BorderSide.none,
                    borderRadius: BorderRadius.all(Radius.circular(10))),
                floatingLabelBehavior: FloatingLabelBehavior.auto,
                labelText: widget.labelText),
            keyboardType: widget.keyboardType,
            onFieldSubmitted: (value) => widget.onFieldSubmitted?.call(value),
            validator: (value) {
              String? result;
              if (widget.isMandatory && (value == null || value.isEmpty)) {
                result = "Preenchimento obrigatório!";
              }
              if (!validarCampo(value, widget.keyboardType)) {
                result = "Preenchimento é inválido.";
              }
              return widget.validator != null
                  ? widget.validator!(value, result)
                  : result;
            },
            onChanged: (text) => widget.onChanged?.call(text)));
  }

  Widget? montarIcone(TextInputType? tipoTeclado) {
    IconData icon = Icons.edit;
    if (tipoTeclado != null) {
      if (tipoTeclado == TextInputType.visiblePassword) {
        icon = isEyesOpen ? Icons.visibility_off : Icons.visibility;
        return GestureDetector(
            onTap: () {
              setState(() {
                isEyesOpen = !isEyesOpen;
              });
            },
            child: Icon(icon));
      }
    }
    return Icon(icon);
  }

  bool validarCampo(String? value, TextInputType? keyboardType) {
    //Caso não haja tipagem para conteúdo ou não haja o conteúdo não há
    //teste a ser feito a validação retorna true (válida)
    if (keyboardType == null || (value == null || value.isEmpty)) return true;
    //Testando e-mail
    if (keyboardType == TextInputType.emailAddress &&
        !RegExp(r"^[a-zA-Z0-9.a-zA-Z0-9.!#$%&'*+-/=?^_`{|}~]+@[a-zA-Z0-9]+\.[a-zA-Z]+")
            .hasMatch(value)) {
      return false;
    }
    //Caso não haja testes a serem feitos a validação retorna true (válida)
    return true;
  }
}
