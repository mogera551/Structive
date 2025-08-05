
対象となるパス
　プレーンなパスではないこと
　getterが定義されていないこと

最適化getter
// users.*.name
get "users.*.name"() {
  return this.users[this.$1].name;
}
set "users.*.name"(value) {
  this.users[this.$1].name = value;
}

// regions.*.states.*.population
get "regions.*.states.*.population"() {
  return this.regions[this.$1].states[this.$2].population;
}
set "regions.*.states.*.population"(value) {
  this.regions[this.$1].states[this.$2].population = value;
}

// パスにgetterを含む場合
get "producs.*.rule"() {
  return getRules(this["prodcuts.*.rulrId"]);
}
get "producs.*.rule.name"() {
  return this["products.*.rule"].name;
}
set "producs.*.rule.name"(value) {
  this["products.*.rule"].name = value;
}
