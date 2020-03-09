import { Component, Prop, Vue } from "vue-property-decorator";
import Utils from "./utils";
import WtmUploadImg from "@/components/page/UploadImg.vue";
/**
 * 创建form
 *
 * 注：
 *    formData虽然是prop参数，但多层级，不符合vue规范，但可以实现父级数据同步；
 *
 */
@Component({
  components: { "wtm-upload-img": WtmUploadImg }
})
export default class CreateForm extends Vue {
  // 表单状态
  @Prop({ type: String, default: "add" }) status;
  // 表单
  @Prop({ type: Object, required: true }) options;
  // row class
  @Prop({ type: String, default: "" }) elRowClass;

  // 事件集合 @Prop({ type: Object, default: () => {} }) events;
  elFormRefKey: string = "ref_name";
  componentObj: any = new Utils();
  // key替换'.'之后的数据
  formData: object = {};
  /**
   * 透传el-form，validate事件
   */
  get validate() {
    const refForm = _.get(this.$refs, this.elFormRefKey);
    return refForm.validate;
  }
  /**
   * 透传el-form组件
   */
  get elForm() {
    const refForm = _.get(this.$refs, this.elFormRefKey);
    return refForm;
  }
  /**
   * 清空el-form验证
   */
  resetFields() {
    const refForm = _.get(this.$refs, this.elFormRefKey);
    return refForm.resetFields();
  }
  /**
   * 'Entity.ID' => Entity: { ID }
   */
  getFormData() {
    let newFormData = {};
    _.mapKeys(this.formData, (value, key) => {
      _.setWith(newFormData, this.KeyByPoint(key), value);
    });
    return newFormData;
  }
  /**
   *  Entity: { ID } => 'Entity.ID'
   */
  setFormData(data) {
    // key包含'.'的数据
    let pointData: object = {};
    _.mapKeys(this.options.formItem, (value, key) => {
      const newKey = this.KeyByString(key);
      this.formData[newKey] = _.get(data, key);
      pointData[key] = _.get(data, key);
    });
    return pointData;
  }

  /**
   * 赋值formData
   * @param path 字段对应路径 a: { b: { c: 1}} , path = a.b.c
   * @param value
   */
  setFormDataItem(path: string, value: any) {
    _.set(this.formData, this.KeyByPoint(path), value);
  }
  /**
   * 返回wtmformItem
   * @param key
   */
  getFormItem(key) {
    const newKey = this.KeyByString(key);
    return this.$refs[newKey];
  }

  createFormData() {
    let formData = {};
    const formItem = this.options.formItem;
    _.mapKeys(formItem, (valule, key) => {
      const newKey = this.KeyByString(key);
      if (_.isNil(valule.defaultValue)) {
        formData[newKey] = ["switch"].includes(valule.type) ? true : "";
      } else {
        formData[newKey] = valule.defaultValue;
      }
    });
    return formData;
  }
  /**
   * e.key => e_partition_key
   */
  private KeyByPoint(key) {
    return key.replace(/_partition_/g, ".");
  }
  /**
   * e_partition_key => e.key
   */
  private KeyByString(key) {
    return key.replace(/(\.)/g, "_partition_");
  }
  created() {
    this.formData = this.createFormData();
  }
  render(h) {
    const components = _.keys(this.formData).map(key => {
      const newKey = this.KeyByPoint(key);
      const item = this.options.formItem[newKey];
      if (_.isFunction(item.isHidden)) {
        if (item.isHidden(this.getFormData(), status)) {
          return;
        }
      }
      if ((_.isBoolean(item.isHidden) && item.isHidden) || !item.type) {
        return;
      }
      const itemComp = this.componentObj[item.type];
      const option = { ...item, key };
      const contentComp = itemComp ? itemComp.call(this, h, option) : null;
      return this.componentObj.wtmFormItem.call(this, h, option, contentComp);
    });
    const props = {
      ...this.options.formProps,
      model: this.formData
    };
    const slots = this.$scopedSlots["default"];
    return (
      <el-form ref={this.elFormRefKey} {...{ props }}>
        <el-row class={this.elRowClass}>
          {components}
          {slots && slots({})}
        </el-row>
      </el-form>
    );
  }
}
