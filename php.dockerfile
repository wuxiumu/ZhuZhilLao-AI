FROM php:8-apache

# 安装 Redis 扩展
RUN pecl install redis && docker-php-ext-enable redis

# 启用 Apache rewrite 模块
RUN a2enmod rewrite

# 设置工作目录
WORKDIR /var/www/html
