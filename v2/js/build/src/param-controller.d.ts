/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @withbastardizations from Yisheng jiang
 */
export declare class ParamController {
    controller_: HTMLInputElement;
    name_: any;
    id_: any;
    onChangeCallback_: any;
    header_: HTMLDivElement;
    /**
     * Event handler and layout for audio parameters with numeric input values
     * @param {String} parentId ID for parent element.
     * @param {Function} onChangeCallback Callback to trigger on input.
     * @param {Object} options Parameters with default values if unspecified.
     * @param {String} options.name The name of the parameter. Default is
     *                              'Parameter'.
     * @param {String} options.id A variable name associated with the parameter.
     *                            Defaults to the value of |name|.
     * @param {String} options.type The type of input (only support for range).
     * @param {Number} options.min The minimum possible value. Default is 0.
     * @param {Number} options.max The maximum possible value. Default is 1.
     * @param {Number} options.step The parameter's increment value.
     *                              Default is 0.1.
     * @param {Number} options.default The default value of the parameter. Default
     *                                 is 0.
     */
    constructor(parentId: any, onChangeCallback: any, options: any);
    /**
     * Enable the slider.
     */
    enable(): void;
    /**
     * Disable the slider.
     */
    disable(): void;
    change_(): void;
}
