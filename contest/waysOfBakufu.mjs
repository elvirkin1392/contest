//B. Пути Бакуфу
/*
* Необходимо разработать функцию createSelector, которая возвращает новую функцию.
* Эта функция при вызове принимает два аргумента: state и опциональные params.
* Она должна возвращать результат работы функции, переданной в createSelector,
* а также список шагов (массив steps) — последовательный список ключей, обращение
* к которым происходило при вычислении результата.
* */
const createSelector = (callback) => {
  return (state, params) => {
    const steps = [];

    const createHandler = (name, mainObject) => {
      return {
        get(target, key, receiver) {
          if (key === 'toJSON') {
            steps.push([name]);
            return () => mainObject;
          }

          if (!Object.hasOwn(receiver, key)) {
            return Reflect.get(target, key, receiver);
          }

          if (target === mainObject) {
            steps.push([name]);
          }

          const currentStep = steps[steps.length - 1];
          currentStep.push(key);

          const value = target[key];
          if (typeof value === 'object' && value != null) {
            return new Proxy(value, createHandler(name, mainObject));
          }

          return Reflect.get(target, key, receiver);
        },
      }
    }

    const proxyState = new Proxy(state, createHandler('arg0', state));
    const proxyParams = params ? new Proxy(params, createHandler('arg1', params)) : undefined;

    return {
      result: callback(proxyState, proxyParams),
      steps
    }
  }
}

const selector1 = createSelector((state) => {
  if (state.isEnabled) {
    return state.inner.value;
  }

  return null;
});

const selector2 = createSelector((state) => {
  if (Array.isArray(state.array) && state.array.length > 0) {
    return state.array[0];
  }

  return null;
});

const selector3 = createSelector((state, params) => {
  if (params.short) {
    return {
      id: state.id,
      name: state.name,
    };
  }

  return state;
});

const result1 = selector1({ isEnabled: true, inner: { value: 42 } })
const result2 = selector1({ isEnabled: false, inner: { value: 21 } })
const result3 = selector2({ array: [1, 2, 3] });
const result4 = selector3({ id: 2135, name: "Ivan", lastname: "Ivanov", age: 25 }, { short: false });

const obj1 = {
  result: 42,
  steps: [
    ["arg0", "isEnabled"],
    ["arg0", "inner", "value"],
  ],
}

const obj2 = {
  result: null,
  steps: [["arg0", "isEnabled"]],
}

const obj3 = {
  result: 1,
  steps: [
    ["arg0", "array"],
    ["arg0", "array", "length"],
    ["arg0", "array", "0"]
  ],
}

const obj4 = {
  result: {
    id: 2135,
    name: "Ivan",
    lastname: "Ivanov",
    age: 25
  },
  steps: [
    ["arg1","short"],
    ["arg0"]
  ]
}

console.log(JSON.stringify(result1) === JSON.stringify(obj1)) // true
console.log(JSON.stringify(result2) === JSON.stringify(obj2)) // true
console.log(JSON.stringify(result3) === JSON.stringify(obj3)) // true
console.log(JSON.stringify(result4) === JSON.stringify(obj4)) // true
